import { GoogleGenerativeAI } from '@google/genai';
import type { SceneDraft } from './gemini';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface VideoGenerationResult {
  operationId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  videoUrl?: string;
  videoData?: Buffer;
  error?: string;
}

export function isVeoConfigured(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.length > 10;
}

export function getVideoModel(): string {
  return process.env.VIDEO_MODEL || 'veo-2.0-generate-001';
}

export async function startVideoGeneration(
  sceneDraft: SceneDraft
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada en el servidor');
  }

  const model = getVideoModel();
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  
  const url = `${baseUrl}/models/${model}:predictLongRunning?key=${GEMINI_API_KEY}`;

  const body = {
    instances: [{
      prompt: sceneDraft.cinematicPrompt,
    }],
    parameters: {
      aspectRatio: '16:9',
      personGeneration: 'allow_adult',
      durationSeconds: 8,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = error?.error?.message || `Error HTTP ${response.status}`;
    throw new Error(`Error al iniciar generación de vídeo: ${msg}`);
  }

  const data = await response.json();
  const operationId = data.name || data.operationId;
  
  if (!operationId) {
    throw new Error('No se recibió ID de operación del proveedor.');
  }

  return operationId;
}

export async function pollVideoStatus(
  operationId: string,
  onStatusUpdate?: (status: string) => void
): Promise<VideoGenerationResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  const maxAttempts = 120;
  const pollInterval = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    onStatusUpdate?.(`Consultando estado... (intento ${attempt + 1})`);

    const url = `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${GEMINI_API_KEY}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error consultando estado: ${response.status}`);
      }

      const data = await response.json();

      if (data.done) {
        return processCompletedOperation(data);
      }

      const elapsed = (attempt + 1) * (pollInterval / 1000);
      onStatusUpdate?.(`Procesando vídeo... (${Math.round(elapsed)}s transcurridos)`);
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error: any) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error('Tiempo máximo de espera superado.');
}

function processCompletedOperation(data: any): VideoGenerationResult {
  if (data.error) {
    return {
      operationId: data.name || '',
      status: 'FAILED',
      error: data.error.message || 'Error desconocido del proveedor.',
    };
  }

  const videoUrl = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
    || data.response?.videos?.[0]?.uri
    || data.response?.generatedVideos?.[0]?.video?.uri
    || null;

  if (!videoUrl) {
    return {
      operationId: data.name || '',
      status: 'FAILED',
      error: 'La operación se completó pero no se encontró URL de vídeo en la respuesta.',
    };
  }

  return {
    operationId: data.name || '',
    status: 'COMPLETED',
    videoUrl,
  };
}

export async function downloadVideo(videoUrl: string): Promise<Buffer> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  const separator = videoUrl.includes('?') ? '&' : '?';
  const fullUrl = `${videoUrl}${separator}key=${GEMINI_API_KEY}`;

  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`Error descargando vídeo: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  if (buffer.length < 1000) {
    throw new Error('El archivo descargado no parece ser un vídeo válido.');
  }

  return buffer;
}

export function estimateCost(model: string, duration: number): string {
  const modelCosts: Record<string, number> = {
    'veo-2.0-generate-001': 0.50,
    'veo-2.0-fast': 0.25,
  };
  
  const cost = modelCosts[model];
  if (cost === undefined) return 'COSTE NO CONFIRMADO';
  return `~$${cost.toFixed(2)} USD (estimación)`;
}
