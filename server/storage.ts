import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const PDF_DIR = path.join(DATA_DIR, 'pdfs');
const VIDEO_DIR = path.join(DATA_DIR, 'videos');

// Ensure directories exist
[PDF_DIR, VIDEO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export function computeChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function savePdf(projectId: string, buffer: Buffer, fileName: string): { path: string; checksum: string } {
  const safeFileName = `${projectId}_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(PDF_DIR, safeFileName);
  
  fs.writeFileSync(filePath, buffer);
  const checksum = computeChecksum(buffer);
  
  return { path: filePath, checksum };
}

export function saveVideo(projectId: string, buffer: Buffer): string {
  const fileName = `${projectId}_${Date.now()}.mp4`;
  const filePath = path.join(VIDEO_DIR, fileName);
  
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function getPdfPath(filePath: string): string | null {
  // Validate path is within PDF_DIR to prevent traversal
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(PDF_DIR))) {
    return null;
  }
  if (!fs.existsSync(resolved)) {
    return null;
  }
  return resolved;
}

export function getVideoPath(filePath: string): string | null {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(VIDEO_DIR))) {
    return null;
  }
  if (!fs.existsSync(resolved)) {
    return null;
  }
  return resolved;
}

export function deleteProjectFiles(projectId: string): void {
  // Delete PDFs
  const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.startsWith(projectId));
  pdfFiles.forEach(f => {
    try { fs.unlinkSync(path.join(PDF_DIR, f)); } catch {}
  });

  // Delete videos
  const videoFiles = fs.readdirSync(VIDEO_DIR).filter(f => f.startsWith(projectId));
  videoFiles.forEach(f => {
    try { fs.unlinkSync(path.join(VIDEO_DIR, f)); } catch {}
  });
}
