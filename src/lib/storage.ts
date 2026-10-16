// Storage simplificado para frontend.
// La persistencia real está en el backend (SQLite).
// Solo se usa para caché temporal de UI.

export function loadConfig() {
  return {
    textModel: 'gemini-2.0-flash',
    videoModel: 'veo-2.0-generate-001',
    defaultStyle: 'cinematográfico realista',
  };
}

export function saveConfig(_config: any): void {
  // Config lives on the server now
}
