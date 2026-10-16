// Frontend no tiene acceso directo a Gemini.
// Todas las llamadas van al backend.
// Este módulo solo provee indicadores de estado.

import * as api from './api';

let _status: { geminiConfigured: boolean; veoConfigured: boolean } | null = null;

export async function refreshStatus(): Promise<void> {
  try {
    const status = await api.getAuthStatus();
    _status = {
      geminiConfigured: status.geminiConfigured,
      veoConfigured: status.veoConfigured,
    };
  } catch {
    _status = { geminiConfigured: false, veoConfigured: false };
  }
}

export function isGeminiConfigured(): boolean {
  return _status?.geminiConfigured ?? false;
}

export function isVeoConfigured(): boolean {
  return _status?.veoConfigured ?? false;
}
