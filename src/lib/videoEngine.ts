import type { SceneDraft } from '../types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function getApiKey(): string {
  const key = localStorage.getItem('andalus_gemini_api_key');
  if (!key) throw new Error('GEMINI_API_KEY no configurada.');
  return key;
}

function getVideoModel(): string {
  return localStorage.getItem('andalus_video_model') || 'veo-2.0-generate-001';
}

export interface VideoGenerationResult {
  operationId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  videoUrl?: string;
  videoBlob?: Blob;
  error?: string;
}

export async function startVideoGeneration(
  sceneDraft: SceneDraft,
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  const apiKey = getApiKey();
  const model = getVideoModel();
  
  onStatusUpdate?.('Enviando prompt al motor de vídeo...');

  // Use Gemini API for video generation
  const url = `${GEMINI_API_BASE}/models/${model}:predictLongRunning?key=${apiKey}`;

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
  const apiKey = getApiKey();
  const maxAttempts = 120; // Max 10 minutes polling
  const pollInterval = 5000; // 5 seconds

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    onStatusUpdate?.(`Consultando estado... (intento ${attempt + 1})`);

    const url = `${GEMINI_API_BASE}/${operationId}?key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Operation might use a different endpoint
          const altUrl = `https://generativelanguage.googleapis.com/v1/${operationId}?key=${apiKey}`;
          const altResponse = await fetch(altUrl);
          if (altResponse.ok) {
            const data = await altResponse.json();
            if (data.done) {
              return processCompletedOperation(data);
            }
          }
        }
        throw new Error(`Error consultando estado: ${response.status}`);
      }

      const data = await response.json();

      if (data.done) {
        return processCompletedOperation(data);
      }

      // Still processing
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

  // Extract video URL from response
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

export async function downloadVideo(videoUrl: string): Promise<Blob> {
  const apiKey = getApiKey();
  // Video URLs from Gemini may need the API key
  const separator = videoUrl.includes('?') ? '&' : '?';
  const fullUrl = `${videoUrl}${separator}key=${apiKey}`;

  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error(`Error descargando vídeo: ${response.status}`);
  }

  const blob = await response.blob();
  
  // Validate it's actually a video
  if (!blob.type.includes('video') && blob.size < 1000) {
    throw new Error('El archivo descargado no parece ser un vídeo válido.');
  }

  return blob;
}

export function createVideoBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export function estimateCost(model: string, duration: number): string {
  // Rough estimates based on known pricing (subject to change)
  const modelCosts: Record<string, number> = {
    'veo-2.0-generate-001': 0.50, // per generation
    'veo-2.0-fast': 0.25,
  };
  
  const cost = modelCosts[model];
  if (cost === undefined) return 'COSTE NO CONFIRMADO';
  return `~$${cost.toFixed(2)} USD (estimación)`;
}
