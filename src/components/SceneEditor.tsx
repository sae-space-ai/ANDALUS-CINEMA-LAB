import React, { useState } from 'react';
import { Edit3, Camera, Users, MapPin, Clock, MessageSquare, Film, CheckCircle, AlertCircle } from 'lucide-react';
import type { SceneDraft } from '../types';

interface SceneEditorProps {
  draft: SceneDraft;
  onApprove: (updatedDraft: SceneDraft) => void;
  onEdit: (updatedDraft: SceneDraft) => void;
  isApproved: boolean;
}

export function SceneEditor({ draft, onApprove, onEdit, isApproved }: SceneEditorProps) {
  const [editing, setEditing] = useState(false);
  const [editedDraft, setEditedDraft] = useState<SceneDraft>(draft);

  const handleSave = () => {
    onEdit(editedDraft);
    setEditing(false);
  };

  const currentDraft = editing ? editedDraft : draft;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-andalus-400" />
          Adaptación Cinematográfica
        </h3>
        {isApproved && (
          <span className="flex items-center gap-1 text-andalus-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Aprobada
          </span>
        )}
      </div>

      {/* Scene details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard icon={FileTextIcon} label="Resumen" value={currentDraft.summary} />
        <InfoCard icon={MapPin} label="Escenario" value={currentDraft.scenario} />
        <InfoCard icon={Clock} label="Momento" value={currentDraft.timeOfDay} />
        <InfoCard icon={Users} label="Personajes" value={currentDraft.characters.join(', ')} />
        <InfoCard icon={Camera} label="Cámara" value={currentDraft.cameraDescription} />
        <InfoCard icon={MessageSquare} label="Diálogo" value={currentDraft.dialogue || '—'} />
      </div>

      {/* Visual atmosphere */}
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-andalus-400 mb-2">Ambiente visual</h4>
        <p className="text-sm text-gray-300">{currentDraft.visualAtmosphere}</p>
      </div>

      {/* Physical actions */}
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-andalus-400 mb-2">Acciones físicas</h4>
        <p className="text-sm text-gray-300">{currentDraft.physicalActions}</p>
      </div>

      {/* Narrative context */}
      <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
        <h4 className="text-sm font-medium text-andalus-400 mb-2">Contexto narrativo</h4>
        <p className="text-sm text-gray-300">{currentDraft.narrativeContext}</p>
      </div>

      {/* Artistic adaptations warning */}
      {currentDraft.artisticAdaptations.length > 0 && (
        <div className="p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Adaptaciones artísticas (no presentes en el texto original)
          </h4>
          <ul className="text-sm text-amber-200/80 list-disc list-inside space-y-1">
            {currentDraft.artisticAdaptations.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cinematic prompt */}
      <div className="p-4 bg-andalus-900/20 border border-andalus-800/50 rounded-lg">
        <h4 className="text-sm font-medium text-andalus-300 mb-2">Prompt cinematográfico para vídeo IA</h4>
        {editing ? (
          <textarea
            value={editedDraft.cinematicPrompt}
            onChange={(e) => setEditedDraft({ ...editedDraft, cinematicPrompt: e.target.value })}
            className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 resize-none focus:outline-none focus:border-andalus-500"
          />
        ) : (
          <p className="text-sm text-andalus-100/80 font-mono leading-relaxed">{currentDraft.cinematicPrompt}</p>
        )}
      </div>

      {/* Source reference */}
      <p className="text-xs text-gray-500">
        Páginas fuente: {currentDraft.sourcePages.join(', ')}
      </p>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {!editing ? (
          <>
            <button
              onClick={() => { setEditedDraft({ ...draft }); setEditing(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Editar escena
            </button>
            {!isApproved && (
              <button
                onClick={() => onApprove(draft)}
                className="flex items-center gap-2 px-6 py-2 bg-andalus-600 hover:bg-andalus-500 text-white text-sm font-medium rounded-lg transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar y generar vídeo
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-andalus-600 hover:bg-andalus-500 text-white text-sm font-medium rounded-lg transition-all"
            >
              Guardar cambios
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-all"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-900/30 border border-gray-800/50 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-andalus-500" />
        <span className="text-xs font-medium text-andalus-400">{label}</span>
      </div>
      <p className="text-sm text-gray-300">{value}</p>
    </div>
  );
}
