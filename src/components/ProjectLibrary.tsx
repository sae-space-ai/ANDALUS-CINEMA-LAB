import React from 'react';
import { Folder, Trash2, Clock, Film, FileText, ChevronRight } from 'lucide-react';
import type { Project } from '../types';

interface ProjectLibraryProps {
  projects: Project[];
  onSelect: (project: Project) => void;
  onDelete: (id: string) => void;
}

export function ProjectLibrary({ projects, onSelect, onDelete }: ProjectLibraryProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
          <Folder className="w-7 h-7 text-gray-600" />
        </div>
        <div>
          <p className="text-gray-400 font-medium">Biblioteca vacía</p>
          <p className="text-gray-600 text-sm mt-1">Sube un PDF para crear tu primer proyecto</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
        Proyectos ({projects.length})
      </h3>
      <div className="space-y-2">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onSelect={() => onSelect(project)}
            onDelete={() => onDelete(project.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, onSelect, onDelete }: { project: Project; onSelect: () => void; onDelete: () => void }) {
  const statusColors: Record<string, string> = {
    CREATED: 'text-gray-400',
    UPLOADED: 'text-blue-400',
    TEXT_EXTRACTED: 'text-cyan-400',
    SCENE_DRAFT: 'text-purple-400',
    AWAITING_APPROVAL: 'text-amber-400',
    APPROVED: 'text-andalus-400',
    QUEUED: 'text-blue-300',
    GENERATING: 'text-andalus-300',
    DOWNLOADING: 'text-andalus-400',
    COMPLETED: 'text-green-400',
    FAILED: 'text-red-400',
    BLOCKED: 'text-red-300',
    CANCELLED: 'text-gray-400',
  };

  const statusLabels: Record<string, string> = {
    CREATED: 'Creado',
    UPLOADED: 'PDF subido',
    TEXT_EXTRACTED: 'Texto extraído',
    SCENE_DRAFT: 'Escena borrador',
    AWAITING_APPROVAL: 'Esperando aprobación',
    APPROVED: 'Aprobada',
    QUEUED: 'En cola',
    GENERATING: 'Generando vídeo',
    DOWNLOADING: 'Descargando',
    COMPLETED: 'Completado',
    FAILED: 'Error',
    BLOCKED: 'Bloqueado',
    CANCELLED: 'Cancelado',
  };

  return (
    <div className="group flex items-center gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-andalus-700/50 hover:bg-andalus-900/10 transition-all cursor-pointer"
      onClick={onSelect}
    >
      <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
        {project.videoUrl ? (
          <Film className="w-5 h-5 text-andalus-400" />
        ) : (
          <FileText className="w-5 h-5 text-gray-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate group-hover:text-andalus-300">
          {project.name}
        </h4>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-xs ${statusColors[project.status] || 'text-gray-400'}`}>
            {statusLabels[project.status] || project.status}
          </span>
          <span className="text-xs text-gray-600">
            {project.pages.length} págs
          </span>
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(project.updatedAt).toLocaleDateString('es-ES')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 text-gray-500 hover:text-red-400 transition-colors"
          title="Eliminar proyecto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </div>
    </div>
  );
}
