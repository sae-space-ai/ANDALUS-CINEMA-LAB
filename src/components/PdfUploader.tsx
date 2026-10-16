import React, { useState, useRef } from 'react';
import { Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { readPdf } from '../lib/pdfReader';
import type { PdfReadResult } from '../lib/pdfReader';

interface PdfUploaderProps {
  onPdfLoaded: (result: PdfReadResult, fileName: string, fileSize: number) => void;
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export function PdfUploader({ onPdfLoaded, onFileUpload, isProcessing }: PdfUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setProgress('Validando PDF...');

    try {
      // First validate locally
      const result = await readPdf(file);
      
      if (result.needsOcr) {
        setError('NEEDS_OCR — Este PDF parece estar escaneado y no contiene texto extraíble.');
        setProgress(null);
        return;
      }

      setProgress(`PDF válido: ${result.totalPages} páginas. Subiendo al servidor...`);
      onPdfLoaded(result, file.name, file.size);
      
      // Upload to backend
      onFileUpload(file);
    } catch (err: any) {
      setError(err.message || 'Error procesando el PDF.');
      setProgress(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-300
          ${dragOver
            ? 'border-andalus-400 bg-andalus-900/30 scale-[1.02]'
            : 'border-andalus-700/50 hover:border-andalus-500 hover:bg-andalus-900/10'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`
            p-4 rounded-full transition-all
            ${dragOver ? 'bg-andalus-500/20' : 'bg-andalus-900/50'}
          `}>
            <Upload className={`w-10 h-10 ${dragOver ? 'text-andalus-400' : 'text-andalus-600'}`} />
          </div>

          <div>
            <p className="text-lg font-medium text-white mb-1">
              Subir PDF de tu obra
            </p>
            <p className="text-sm text-gray-400">
              Arrastra aquí o haz clic para seleccionar • Máx. 50 MB
            </p>
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 text-andalus-400">
              <div className="w-4 h-4 border-2 border-andalus-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Procesando...</span>
            </div>
          )}
        </div>
      </div>

      {progress && (
        <div className="mt-4 flex items-center gap-2 text-andalus-400 animate-slide-up">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">{progress}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 text-amber-400 animate-slide-up">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
