import * as pdfjsLib from 'pdfjs-dist';
import type { PdfPage } from '../types';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export interface PdfReadResult {
  pages: PdfPage[];
  fullText: string;
  totalPages: number;
  needsOcr: boolean;
  checksum: string;
}

async function computeChecksum(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function readPdf(file: File): Promise<PdfReadResult> {
  // Validate file type
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('El archivo no es un PDF válido.');
  }

  // Validate size (max 50MB)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('El PDF supera el tamaño máximo de 50 MB.');
  }

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const checksum = await computeChecksum(arrayBuffer);

  // Load PDF
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pages: PdfPage[] = [];
  let fullText = '';
  let totalChars = 0;

  // Extract text page by page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .trim();

    pages.push({
      pageNumber: i,
      text: pageText,
    });

    fullText += pageText + '\n\n';
    totalChars += pageText.length;
  }

  // Detect if PDF is scanned (no extractable text)
  const needsOcr = totalChars < 50 && pdf.numPages > 0;

  return {
    pages,
    fullText: fullText.trim(),
    totalPages: pdf.numPages,
    needsOcr,
    checksum,
  };
}

export function extractChapters(pages: PdfPage[]): { title: string; startPage: number; endPage: number; text: string }[] {
  // Simple chapter detection based on common patterns
  const chapters: { title: string; startPage: number; endPage: number; text: string }[] = [];
  const chapterPattern = /^(cap[ií]tulo|chapter|parte|part)\s+[IVXLCDM\d]+/i;
  
  let currentChapter: { title: string; startPage: number; endPage: number; text: string } | null = null;

  for (const page of pages) {
    const lines = page.text.split('\n');
    const firstLine = lines[0]?.trim() || '';

    if (chapterPattern.test(firstLine) || (page.pageNumber === 1 && page.text.length > 0)) {
      if (currentChapter) {
        currentChapter.endPage = page.pageNumber - 1;
        chapters.push(currentChapter);
      }
      currentChapter = {
        title: page.pageNumber === 1 ? 'Inicio del documento' : firstLine.substring(0, 80),
        startPage: page.pageNumber,
        endPage: pages[pages.length - 1].pageNumber,
        text: page.text,
      };
    } else if (currentChapter) {
      currentChapter.text += '\n\n' + page.text;
      currentChapter.endPage = page.pageNumber;
    }
  }

  if (currentChapter) {
    chapters.push(currentChapter);
  }

  // If no chapters detected, return pages as groups
  if (chapters.length === 0 && pages.length > 0) {
    const groupSize = Math.max(1, Math.ceil(pages.length / 10));
    for (let i = 0; i < pages.length; i += groupSize) {
      const group = pages.slice(i, i + groupSize);
      chapters.push({
        title: `Páginas ${group[0].pageNumber}–${group[group.length - 1].pageNumber}`,
        startPage: group[0].pageNumber,
        endPage: group[group.length - 1].pageNumber,
        text: group.map(p => p.text).join('\n\n'),
      });
    }
  }

  return chapters;
}
