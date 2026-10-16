import { GoogleGenerativeAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.length > 10;
}

function getClient(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no configurada en el servidor');
  }
  return new GoogleGenerativeAI(GEMINI_API_KEY);
}

export interface SceneDraft {
  summary: string;
  narrativeContext: string;
  characters: string[];
  scenario: string;
  timeOfDay: string;
  physicalActions: string;
  visualAtmosphere: string;
  dialogue: string;
  cameraDescription: string;
  estimatedDuration: string;
  cinematicPrompt: string;
  sourcePages: number[];
  artisticAdaptations: string[];
}

export interface CinematicBible {
  characters: Array<{
    name: string;
    visualTraits: string;
    wardrobe: string;
    description: string;
  }>;
  scenarios: string[];
  epoch: string;
  atmosphere: string;
  style: string;
  relationships: string[];
  narrativeReferences: string[];
}

export async function generateSceneDraft(
  fragmentText: string,
  sourcePages: number[],
  bible: CinematicBible | null,
  style: string = 'cinematográfico realista'
): Promise<SceneDraft> {
  const client = getClient();
  const model = client.getGenerativeModel({ 
    model: process.env.TEXT_MODEL || 'gemini-2.0-flash' 
  });

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

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const response = await result.response;
  const text = response.text();

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('La respuesta del modelo no contiene JSON válido.');
  
  const draft = JSON.parse(jsonMatch[0]) as SceneDraft;
  
  if (!draft.cinematicPrompt || !draft.summary) {
    throw new Error('La adaptación generada está incompleta.');
  }

  return draft;
}

export async function generateBible(fullText: string): Promise<CinematicBible> {
  const client = getClient();
  const model = client.getGenerativeModel({ 
    model: process.env.TEXT_MODEL || 'gemini-2.0-flash' 
  });

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

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const response = await result.response;
  const text = response.text();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('La respuesta del modelo no contiene JSON válido.');
  
  return JSON.parse(jsonMatch[0]) as CinematicBible;
}
