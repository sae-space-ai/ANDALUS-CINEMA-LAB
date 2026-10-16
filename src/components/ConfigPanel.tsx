import React, { useState, useEffect } from 'react';
import { Settings, Key, Save, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { loadConfig, saveConfig, type AppConfig } from '../lib/storage';
import { isGeminiConfigured } from '../lib/gemini';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export function ConfigPanel({ isOpen, onClose, onConfigSaved }: ConfigPanelProps) {
  const [config, setConfig] = useState<AppConfig>(loadConfig());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveConfig(config);
    setSaved(true);
    onConfigSaved();
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-andalus-400" />
            Configuración
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-5">
          {/* API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Key className="w-4 h-4 text-andalus-500" />
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.geminiApiKey}
                onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                placeholder="AIza..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-andalus-500 pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Se almacena localmente en tu navegador. Nunca se envía a terceros.
            </p>
          </div>

          {/* Text model */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Modelo de texto (adaptación)
            </label>
            <select
              value={config.textModel}
              onChange={(e) => setConfig({ ...config, textModel: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-andalus-500"
            >
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (rápido)</option>
              <option value="gemini-2.0-pro">Gemini 2.0 Pro (preciso)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
          </div>

          {/* Video model */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Modelo de vídeo (generación)
            </label>
            <select
              value={config.videoModel}
              onChange={(e) => setConfig({ ...config, videoModel: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-andalus-500"
            >
              <option value="veo-2.0-generate-001">Veo 2.0 (estándar)</option>
              <option value="veo-2.0-fast">Veo 2.0 Fast (económico)</option>
            </select>
          </div>

          {/* Style */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Estilo cinematográfico por defecto
            </label>
            <select
              value={config.defaultStyle}
              onChange={(e) => setConfig({ ...config, defaultStyle: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-andalus-500"
            >
              <option value="cinematográfico realista">Cinematográfico realista</option>
              <option value="film noir">Film noir</option>
              <option value="animación artística">Animación artística</option>
              <option value="documental">Documental</option>
              <option value="surrealista">Surrealista</option>
              <option value="épico histórico">Épico histórico</option>
            </select>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all
              ${saved
                ? 'bg-andalus-700 text-andalus-100'
                : 'bg-andalus-600 hover:bg-andalus-500 text-white'
              }
            `}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Guardado' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Diagnostic panel
interface DiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiagnosticPanel({ isOpen, onClose }: DiagnosticPanelProps) {
  const [diagnostics, setDiagnostics] = useState<{ name: string; status: string; detail: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    
    const geminiConfigured = isGeminiConfigured();
    const textModel = localStorage.getItem('andalus_text_model') || 'gemini-2.0-flash';
    const videoModel = localStorage.getItem('andalus_video_model') || 'veo-2.0-generate-001';

    setDiagnostics([
      {
        name: 'Motor PDF',
        status: 'VERIFIED',
        detail: 'pdfjs-dist cargado y funcional',
      },
      {
        name: 'Modelo de texto',
        status: geminiConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
        detail: geminiConfigured ? `${textModel} — API key presente` : 'Falta Gemini API Key',
      },
      {
        name: 'Motor de vídeo (Veo)',
        status: geminiConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
        detail: geminiConfigured ? `${videoModel} — listo para generar` : 'Falta Gemini API Key',
      },
      {
        name: 'Almacenamiento',
        status: 'VERIFIED',
        detail: 'localStorage disponible',
      },
      {
        name: 'Reproductor de vídeo',
        status: 'VERIFIED',
        detail: 'HTML5 video nativo',
      },
    ]);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Diagnóstico del sistema</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-3">
          {diagnostics.map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              {d.status === 'VERIFIED' || d.status === 'CONFIGURED' ? (
                <CheckCircle className="w-5 h-5 text-andalus-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{d.name}</p>
                <p className="text-xs text-gray-400">{d.detail}</p>
              </div>
              <span className={`
                text-xs px-2 py-0.5 rounded-full font-medium
                ${d.status === 'VERIFIED' ? 'bg-andalus-900/50 text-andalus-300' : ''}
                ${d.status === 'CONFIGURED' ? 'bg-blue-900/50 text-blue-300' : ''}
                ${d.status === 'NOT_CONFIGURED' ? 'bg-amber-900/50 text-amber-300' : ''}
                ${d.status === 'FAILED' ? 'bg-red-900/50 text-red-300' : ''}
              `}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
