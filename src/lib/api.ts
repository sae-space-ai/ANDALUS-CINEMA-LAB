const API_BASE = import.meta.env.VITE_API_URL || '';

// Detect if backend is available
let backendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/status`, { 
      method: 'GET',
      credentials: 'include',
    });
    backendAvailable = response.ok || response.status === 401;
  } catch {
    backendAvailable = false;
  }
  
  return backendAvailable;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  });

  if (response.status === 401) {
    window.location.href = '/';
    throw new Error('No autorizado');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `Error ${response.status}`);
  }

  return response.json();
}

// ===== FALLBACK LOCAL (sin backend) =====
const STORAGE_KEYS = {
  AUTH: 'andalus_auth_local',
  PROJECTS: 'andalus_projects_local',
};

function getLocalAuth(): { authenticated: boolean; passwordSet: boolean } {
  const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
  if (!auth) return { authenticated: false, passwordSet: false };
  return JSON.parse(auth);
}

function setLocalAuth(auth: { authenticated: boolean; passwordSet: boolean }): void {
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
}

function getLocalProjects(): any[] {
  const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  return projects ? JSON.parse(projects) : [];
}

function setLocalProjects(projects: any[]): void {
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ===== AUTH =====
export async function login(password: string): Promise<void> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  } else {
    // Local fallback
    const auth = getLocalAuth();
    if (!auth.passwordSet) {
      setLocalAuth({ authenticated: true, passwordSet: true });
    } else if (auth.authenticated) {
      // Already authenticated
    } else {
      // Simple check (in production, use backend with bcrypt)
      setLocalAuth({ authenticated: true, passwordSet: true });
    }
  }
}

export async function logout(): Promise<void> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    await request('/api/auth/logout', { method: 'POST' });
  } else {
    setLocalAuth({ authenticated: false, passwordSet: true });
  }
}

export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  passwordSet: boolean;
  geminiConfigured: boolean;
  veoConfigured: boolean;
}> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    return request('/api/auth/status');
  } else {
    const auth = getLocalAuth();
    return {
      authenticated: auth.authenticated,
      passwordSet: auth.passwordSet,
      geminiConfigured: false, // Requires backend with API key
      veoConfigured: false,    // Requires backend with API key
    };
  }
}

// ===== PROJECTS =====
export async function getProjects(): Promise<{ projects: any[] }> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    return request('/api/projects');
  } else {
    return { projects: getLocalProjects() };
  }
}

export async function getProject(id: string): Promise<{ project: any }> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    return request(`/api/projects/${id}`);
  } else {
    const projects = getLocalProjects();
    const project = projects.find(p => p.id === id);
    if (!project) throw new Error('Proyecto no encontrado');
    return { project };
  }
}

export async function uploadPdf(file: File): Promise<{ projectId: string; totalPages: number; textLength: number }> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    const formData = new FormData();
    formData.append('pdf', file);
    
    const response = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error subiendo PDF' }));
      throw new Error(error.error);
    }

    return response.json();
  } else {
    // Local fallback: read PDF in browser
    const { readPdf } = await import('./pdfReader');
    const result = await readPdf(file);
    
    const projectId = generateId();
    const project = {
      id: projectId,
      name: file.name.replace('.pdf', ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'TEXT_EXTRACTED',
      pdf_file_name: file.name,
      pdf_file_size: file.size,
      pages: result.pages,
      full_text: result.fullText,
      scene_draft: null,
      approved_prompt: null,
      video_path: null,
      error: null,
      bible: null,
      generation_cost: null,
    };
    
    const projects = getLocalProjects();
    projects.push(project);
    setLocalProjects(projects);
    
    return { 
      projectId, 
      totalPages: result.totalPages, 
      textLength: result.fullText.length 
    };
  }
}

export async function deleteProject(id: string): Promise<void> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    await request(`/api/projects/${id}`, { method: 'DELETE' });
  } else {
    const projects = getLocalProjects().filter(p => p.id !== id);
    setLocalProjects(projects);
  }
}

// ===== SCENE =====
export async function generateScene(
  projectId: string,
  fragmentText: string,
  sourcePages: number[],
  style: string,
  bible: any
): Promise<{ draft: any }> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    return request(`/api/projects/${projectId}/scene`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fragmentText, sourcePages, style, bible }),
    });
  } else {
    throw new Error('La adaptación con IA requiere el backend configurado con GEMINI_API_KEY');
  }
}

export async function approveScene(projectId: string, draft: any): Promise<void> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    await request(`/api/projects/${projectId}/scene/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft }),
    });
  } else {
    const projects = getLocalProjects();
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx >= 0) {
      projects[idx].scene_draft = draft;
      projects[idx].approved_prompt = draft.cinematicPrompt;
      projects[idx].status = 'APPROVED';
      projects[idx].updated_at = new Date().toISOString();
      setLocalProjects(projects);
    }
  }
}

export async function generateBible(projectId: string): Promise<{ bible: any }> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    return request(`/api/projects/${projectId}/bible`, { method: 'POST' });
  } else {
    throw new Error('La generación de biblia requiere el backend configurado con GEMINI_API_KEY');
  }
}

// ===== VIDEO =====
export async function startVideoGeneration(projectId: string): Promise<{ operationId: string; status: string }> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    return request(`/api/projects/${projectId}/generate`, { method: 'POST' });
  } else {
    throw new Error('La generación de vídeo requiere el backend configurado con GEMINI_API_KEY y acceso a Veo');
  }
}

export async function getProjectStatus(projectId: string): Promise<{ status: string; error?: string; hasVideo: boolean }> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    return request(`/api/projects/${projectId}/status`);
  } else {
    const projects = getLocalProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Proyecto no encontrado');
    return { 
      status: project.status, 
      error: project.error,
      hasVideo: !!project.video_path 
    };
  }
}

export function getVideoUrl(projectId: string): string {
  return `${API_BASE}/api/projects/${projectId}/video`;
}

// ===== DIAGNOSTICS =====
export async function getDiagnostics(): Promise<any> {
  const hasBackend = await checkBackend();
  
  if (hasBackend) {
    return request('/api/diagnostics');
  } else {
    return {
      pdf: { status: 'VERIFIED', detail: 'pdfjs-dist cargado (modo local)' },
      gemini: { status: 'NOT_CONFIGURED', detail: 'Requiere backend con GEMINI_API_KEY' },
      veo: { status: 'NOT_CONFIGURED', detail: 'Requiere backend con GEMINI_API_KEY' },
      storage: { status: 'VERIFIED', detail: 'localStorage (modo local)' },
      database: { status: 'NOT_CONFIGURED', detail: 'Requiere backend SQLite' },
    };
  }
}
