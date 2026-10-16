import type { SceneDraft, CinematicBible } from '../types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function getApiKey(): string {
  const key = localStorage.getItem('andalus_gemini_api_key');
  if (!key) throw new Error('GEMINI_API_KEY no configurada. Ve a Configuración para añadirla.');
  return key;
}

export function isGeminiConfigured(): boolean {
  return !!localStorage.getItem('andalus_gemini_api_key');
}

async function callGeminiText(model: string, prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = getApiKey();
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Error Gemini API (${response.status}): ${error?.error?.message || 'Desconocido'}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Respuesta vacía del modelo.');
  return text;
}

export async function generateSceneDraft(
  fragmentText: string,
  sourcePages: number[],
  bible: CinematicBible | null,
  style: string = 'cinematográfico realista'
): Promise<SceneDraft> {
  const systemInstruction = `Eres un guionista cinematográfico profesional especializado en adaptación literaria.
Tu trabajo es convertir fragmentos de texto literario en descripciones de escenas cinematográficas.
Responde SIEMPRE en formato JSON válido.
No inventes personajes que no aparezcan en el texto.
Distingue claramente entre lo que dice el texto y tus adaptaciones artísticas.`;

  const bibleContext = bible ? `
BIBLIA CINEMATOGRÁFICA DEL PROYECTO:
Personajes: ${bible.characters.map(c => `${c.name} (${c.visualTraits}, ${c.wardrobe})`).join('; ')}
Escenarios: ${bible.scenarios.join(', ')}
Época: ${bible.epoch}
Atmósfera: ${bible.atmosphere}
Estilo: ${bible.style}
` : '';

  const prompt = `Convierte el siguiente fragmento literario en una escena cinematográfica.

ESTILO SOLICITADO: ${style}
${bibleContext}

FRAGMENTO (páginas ${sourcePages.join(', ')}):
---
${fragmentText.substring(0, 6000)}
---

Responde EXCLUSIVAMENTE con un JSON con esta estructura exacta:
{
  "summary": "Resumen breve de la acción (1-2 frases)",
  "narrativeContext": "Contexto narrativo de la escena",
  "characters": ["lista de personajes presentes"],
  "scenario": "Descripción del escenario",
  "timeOfDay": "Momento del día",
  "physicalActions": "Acciones físicas que ocurren",
  "visualAtmosphere": "Ambiente visual detallado",
  "dialogue": "Diálogo breve si corresponde, vacío si no hay",
  "cameraDescription": "Descripción de cámara y movimiento",
  "estimatedDuration": "Duración prevista en segundos",
  "cinematicPrompt": "Prompt completo en inglés para generación de vídeo IA, detallado y cinematográfico",
  "sourcePages": [${sourcePages.join(',')}],
  "artisticAdaptations": ["lista de adaptaciones artísticas añadidas que no están explícitas en el texto"]
}`;

  const response = await callGeminiText(
    localStorage.getItem('andalus_text_model') || 'gemini-2.0-flash',
    prompt,
    systemInstruction
  );

  // Parse JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('La respuesta del modelo no contiene JSON válido.');
  
  const draft = JSON.parse(jsonMatch[0]) as SceneDraft;
  
  // Validate required fields
  if (!draft.cinematicPrompt || !draft.summary) {
    throw new Error('La adaptación generada está incompleta.');
  }

  return draft;
}

export async function generateBible(
  fullText: string
): Promise<CinematicBible> {
  const systemInstruction = `Eres un director cinematográfico que crea la biblia visual de una adaptación.
Extrae información del texto para mantener continuidad visual.
Responde SIEMPRE en formato JSON válido.`;

  const prompt = `A partir del siguiente texto, extrae la información para una biblia cinematográfica mínima.

TEXTO (primeros 8000 caracteres):
---
${fullText.substring(0, 8000)}
---

Responde EXCLUSIVAMENTE con un JSON:
{
  "characters": [
    {
      "name": "Nombre del personaje",
      "visualTraits": "Rasgos físicos visibles",
      "wardrobe": "Vestuario descrito",
      "description": "Descripción breve"
    }
  ],
  "scenarios": ["lista de escenarios principales"],
  "epoch": "Época o periodo temporal",
  "atmosphere": "Atmósfera general de la obra",
  "style": "Estilo visual recomendado",
  "relationships": ["relaciones entre personajes"],
  "narrativeReferences": ["referencias narrativas o visuales relevantes"]
}`;

  const response = await callGeminiText(
    localStorage.getItem('andalus_text_model') || 'gemini-2.0-flash',
    prompt,
    systemInstruction
  );

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('La respuesta del modelo no contiene JSON válido.');
  
  return JSON.parse(jsonMatch[0]) as CinematicBible;
}
