import type { Project } from '../types';

const STORAGE_KEY = 'andalus_cinema_projects';
const CONFIG_KEY = 'andalus_cinema_config';

export function loadProjects(): Project[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function saveProject(project: Project): void {
  const projects = loadProjects();
  const index = projects.findIndex(p => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  saveProjects(projects);
}

export function deleteProject(id: string): void {
  const projects = loadProjects().filter(p => p.id !== id);
  saveProjects(projects);
  // Clean up video blob
  try {
    const videoKey = `andalus_video_${id}`;
    localStorage.removeItem(videoKey);
  } catch {}
}

export function getProject(id: string): Project | undefined {
  return loadProjects().find(p => p.id === id);
}

export interface AppConfig {
  geminiApiKey: string;
  textModel: string;
  videoModel: string;
  maxUploadMb: number;
  defaultStyle: string;
}

export function loadConfig(): AppConfig {
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : {
      geminiApiKey: '',
      textModel: 'gemini-2.0-flash',
      videoModel: 'veo-2.0-generate-001',
      maxUploadMb: 50,
      defaultStyle: 'cinematográfico realista',
    };
  } catch {
    return {
      geminiApiKey: '',
      textModel: 'gemini-2.0-flash',
      videoModel: 'veo-2.0-generate-001',
      maxUploadMb: 50,
      defaultStyle: 'cinematográfico realista',
    };
  }
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  if (config.geminiApiKey) {
    localStorage.setItem('andalus_gemini_api_key', config.geminiApiKey);
  }
  localStorage.setItem('andalus_text_model', config.textModel);
  localStorage.setItem('andalus_video_model', config.videoModel);
}

export function storeVideoBlob(projectId: string, blob: Blob): string {
  // Store as data URL for persistence (for small files)
  // For larger files, we'd use IndexedDB
  const reader = new FileReader();
  const url = URL.createObjectURL(blob);
  // Store the object URL reference
  sessionStorage.setItem(`andalus_video_url_${projectId}`, url);
  return url;
}

export function getVideoBlobUrl(projectId: string): string | null {
  return sessionStorage.getItem(`andalus_video_url_${projectId}`);
}
