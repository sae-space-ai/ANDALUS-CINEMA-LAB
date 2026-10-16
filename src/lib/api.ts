const API_BASE = import.meta.env.VITE_API_URL || '';

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
    // Redirect to login
    window.location.href = '/';
    throw new Error('No autorizado');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || `Error ${response.status}`);
  }

  return response.json();
}

// Auth
export async function login(password: string): Promise<void> {
  await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' });
}

export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  passwordSet: boolean;
  geminiConfigured: boolean;
  veoConfigured: boolean;
}> {
  return request('/api/auth/status');
}

// Projects
export async function getProjects(): Promise<{ projects: any[] }> {
  return request('/api/projects');
}

export async function getProject(id: string): Promise<{ project: any }> {
  return request(`/api/projects/${id}`);
}

export async function uploadPdf(file: File): Promise<{ projectId: string; totalPages: number; textLength: number }> {
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
}

export async function deleteProject(id: string): Promise<void> {
  await request(`/api/projects/${id}`, { method: 'DELETE' });
}

// Scene
export async function generateScene(
  projectId: string,
  fragmentText: string,
  sourcePages: number[],
  style: string,
  bible: any
): Promise<{ draft: any }> {
  return request(`/api/projects/${projectId}/scene`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fragmentText, sourcePages, style, bible }),
  });
}

export async function approveScene(projectId: string, draft: any): Promise<void> {
  await request(`/api/projects/${projectId}/scene/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft }),
  });
}

export async function generateBible(projectId: string): Promise<{ bible: any }> {
  return request(`/api/projects/${projectId}/bible`, { method: 'POST' });
}

// Video
export async function startVideoGeneration(projectId: string): Promise<{ operationId: string; status: string }> {
  return request(`/api/projects/${projectId}/generate`, { method: 'POST' });
}

export async function getProjectStatus(projectId: string): Promise<{ status: string; error?: string; hasVideo: boolean }> {
  return request(`/api/projects/${projectId}/status`);
}

export function getVideoUrl(projectId: string): string {
  return `${API_BASE}/api/projects/${projectId}/video`;
}

// Diagnostics
export async function getDiagnostics(): Promise<any> {
  return request('/api/diagnostics');
}
