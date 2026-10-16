import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, AlertTriangle, Shield, Server } from 'lucide-react';
import * as api from '../lib/api';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  serverStatus: {
    geminiConfigured: boolean;
    veoConfigured: boolean;
    passwordSet: boolean;
  };
}

export function ConfigPanel({ isOpen, onClose, serverStatus }: ConfigPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-andalus-400" />
            Configuración del servidor
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-5">
          {/* Security notice */}
          <div className="p-3 bg-andalus-900/20 border border-andalus-800/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-andalus-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-andalus-200 font-medium">Seguridad</p>
                <p className="text-xs text-andalus-300/70 mt-1">
                  La API key se configura exclusivamente en el servidor mediante variable de entorno.
                  Nunca se expone en el navegador ni en el código frontend.
                </p>
              </div>
            </div>
          </div>

          {/* Server status */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Server className="w-4 h-4" />
              Estado del servidor
            </h3>

            <StatusRow
              label="Autenticación"
              configured={serverStatus.passwordSet}
              detail={serverStatus.passwordSet ? 'Contraseña configurada' : 'Sin contraseña (se configura al primer acceso)'}
            />

            <StatusRow
              label="Gemini (texto)"
              configured={serverStatus.geminiConfigured}
              detail={serverStatus.geminiConfigured ? 'API key configurada en servidor' : 'Falta GEMINI_API_KEY en el servidor'}
            />

            <StatusRow
              label="Veo (vídeo)"
              configured={serverStatus.veoConfigured}
              detail={serverStatus.veoConfigured ? 'Motor de vídeo disponible' : 'Falta GEMINI_API_KEY para Veo'}
            />
          </div>

          {/* Instructions */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Configurar variables de entorno</h4>
            <pre className="text-xs text-gray-400 font-mono overflow-x-auto">
{`# .env (en el servidor)
GEMINI_API_KEY=AIza...
TEXT_MODEL=gemini-2.0-flash
VIDEO_MODEL=veo-2.0-generate-001
SESSION_SECRET=string-aleatorio-seguro
DATA_DIR=./data`}
            </pre>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, configured, detail }: { label: string; configured: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      {configured ? (
        <CheckCircle className="w-5 h-5 text-andalus-400 shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-400">{detail}</p>
      </div>
      <span className={`
        text-xs px-2 py-0.5 rounded-full font-medium
        ${configured ? 'bg-andalus-900/50 text-andalus-300' : 'bg-amber-900/50 text-amber-300'}
      `}>
        {configured ? 'ACTIVO' : 'PENDIENTE'}
      </span>
    </div>
  );
}

// Diagnostic panel
interface DiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiagnosticPanel({ isOpen, onClose }: DiagnosticPanelProps) {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    api.getDiagnostics()
      .then(setDiagnostics)
      .catch(() => setDiagnostics(null))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Diagnóstico del sistema</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-andalus-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && diagnostics && (
          <div className="space-y-3">
            {Object.entries(diagnostics).map(([key, value]: [string, any]) => (
              <div key={key} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                {value.status === 'VERIFIED' || value.status === 'CONFIGURED' ? (
                  <CheckCircle className="w-5 h-5 text-andalus-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white capitalize">{key}</p>
                  <p className="text-xs text-gray-400">{value.detail}</p>
                </div>
                <span className={`
                  text-xs px-2 py-0.5 rounded-full font-medium
                  ${value.status === 'VERIFIED' ? 'bg-andalus-900/50 text-andalus-300' : ''}
                  ${value.status === 'CONFIGURED' ? 'bg-blue-900/50 text-blue-300' : ''}
                  ${value.status === 'NOT_CONFIGURED' ? 'bg-amber-900/50 text-amber-300' : ''}
                  ${value.status === 'FAILED' ? 'bg-red-900/50 text-red-300' : ''}
                `}>
                  {value.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {!loading && !diagnostics && (
          <div className="text-center py-8 text-gray-500">
            <p>No se pudo conectar con el servidor de diagnóstico.</p>
            <p className="text-xs mt-1">Asegúrate de que el backend está ejecutándose.</p>
          </div>
        )}
      </div>
    </div>
  );
}
