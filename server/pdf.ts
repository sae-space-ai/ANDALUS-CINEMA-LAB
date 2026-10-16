import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface PdfReadResult {
  pages: PdfPage[];
  fullText: string;
  totalPages: number;
  needsOcr: boolean;
}

export async function readPdfBuffer(buffer: Buffer): Promise<PdfReadResult> {
  const uint8 = new Uint8Array(buffer);
  
  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pages: PdfPage[] = [];
  let fullText = '';
  let totalChars = 0;

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

  const needsOcr = totalChars < 50 && pdf.numPages > 0;

  return {
    pages,
    fullText: fullText.trim(),
    totalPages: pdf.numPages,
    needsOcr,
  };
}
