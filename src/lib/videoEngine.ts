// Frontend no tiene acceso directo a Veo.
// Todas las llamadas van al backend.
// Este módulo solo provee indicadores.

import * as api from './api';

export function isVeoConfigured(): boolean {
  // This will be checked via auth status
  return false; // Will be overridden by actual status check
}

export function getVideoUrl(projectId: string): string {
  return api.getVideoUrl(projectId);
}

export function estimateCost(model: string): string {
  const modelCosts: Record<string, number> = {
    'veo-2.0-generate-001': 0.50,
    'veo-2.0-fast': 0.25,
  };
  const cost = modelCosts[model];
  if (cost === undefined) return 'COSTE NO CONFIRMADO';
  return `~$${cost.toFixed(2)} USD (estimación)`;
}
