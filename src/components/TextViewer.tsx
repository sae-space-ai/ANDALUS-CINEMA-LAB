import React, { useState } from 'react';
import { FileText, ChevronRight, BookOpen, Scissors } from 'lucide-react';
import type { PdfPage } from '../types';
import { extractChapters } from '../lib/pdfReader';

interface TextViewerProps {
  pages: PdfPage[];
  fullText: string;
  onSelectFragment: (text: string, pageNumbers: number[]) => void;
}

export function TextViewer({ pages, fullText, onSelectFragment }: TextViewerProps) {
  const [viewMode, setViewMode] = useState<'chapters' | 'pages' | 'full'>('chapters');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [customSelection, setCustomSelection] = useState('');

  const chapters = extractChapters(pages);

  const handlePageToggle = (pageNum: number) => {
    const next = new Set(selectedPages);
    if (next.has(pageNum)) next.delete(pageNum);
    else next.add(pageNum);
    setSelectedPages(next);
  };

  const handleSelectPages = () => {
    if (selectedPages.size === 0) return;
    const sorted = Array.from(selectedPages).sort((a, b) => a - b);
    const text = pages
      .filter(p => selectedPages.has(p.pageNumber))
      .map(p => p.text)
      .join('\n\n');
    onSelectFragment(text, sorted);
  };

  const handleCustomSelection = () => {
    if (!customSelection.trim()) return;
    const startPage = pages[0]?.pageNumber || 1;
    onSelectFragment(customSelection, [startPage]);
  };

  return (
    <div className="space-y-4">
      {/* View mode tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
        {[
          { id: 'chapters' as const, label: 'Capítulos', icon: BookOpen },
          { id: 'pages' as const, label: 'Páginas', icon: FileText },
          { id: 'full' as const, label: 'Texto completo', icon: Scissors },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${viewMode === tab.id
                ? 'bg-andalus-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chapters view */}
      {viewMode === 'chapters' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {chapters.map((chapter, i) => (
            <button
              key={i}
              onClick={() => onSelectFragment(chapter.text, Array.from({ length: chapter.endPage - chapter.startPage + 1 }, (_, j) => chapter.startPage + j))}
              className="w-full text-left p-4 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-andalus-600 hover:bg-andalus-900/20 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white group-hover:text-andalus-300">
                    {chapter.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Páginas {chapter.startPage}–{chapter.endPage} • {chapter.text.length.toLocaleString()} caracteres
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-andalus-400" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pages view with multi-select */}
      {viewMode === 'pages' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Selecciona páginas para adaptar: <span className="text-andalus-400 font-medium">{selectedPages.size} seleccionadas</span>
            </p>
            <button
              onClick={handleSelectPages}
              disabled={selectedPages.size === 0}
              className="px-4 py-2 bg-andalus-600 hover:bg-andalus-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
            >
              Adaptar selección
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
            {pages.map(page => (
              <button
                key={page.pageNumber}
                onClick={() => handlePageToggle(page.pageNumber)}
                className={`
                  p-3 rounded-lg border text-sm text-left transition-all
                  ${selectedPages.has(page.pageNumber)
                    ? 'border-andalus-500 bg-andalus-900/40 text-andalus-300'
                    : 'border-gray-800 bg-gray-900/30 text-gray-400 hover:border-gray-600'
                  }
                `}
              >
                <div className="font-medium">Pág. {page.pageNumber}</div>
                <div className="text-xs mt-1 truncate opacity-60">
                  {page.text.substring(0, 60)}...
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full text with custom selection */}
      {viewMode === 'full' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Pega o edita el fragmento que deseas adaptar a escena cinematográfica.
          </p>
          <textarea
            value={customSelection}
            onChange={(e) => setCustomSelection(e.target.value)}
            placeholder="Selecciona y pega aquí el fragmento de texto que quieres convertir en escena..."
            className="w-full h-64 bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-andalus-500 focus:ring-1 focus:ring-andalus-500/30"
          />
          <button
            onClick={handleCustomSelection}
            disabled={!customSelection.trim()}
            className="px-4 py-2 bg-andalus-600 hover:bg-andalus-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
          >
            Adaptar fragmento personalizado
          </button>
        </div>
      )}
    </div>
  );
}
