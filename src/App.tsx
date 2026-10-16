import React, { useState, useEffect, useCallback } from 'react';
import {
  Film, Settings, Activity, BookOpen, Sparkles,
  ArrowLeft, Shield, AlertTriangle, Clapperboard,
  ChevronRight, Zap, Lock, Eye, LogOut
} from 'lucide-react';
import { PdfUploader } from './components/PdfUploader';
import { TextViewer } from './components/TextViewer';
import { SceneEditor } from './components/SceneEditor';
import { VideoPlayer } from './components/VideoPlayer';
import { ConfigPanel, DiagnosticPanel } from './components/ConfigPanel';
import { ProjectLibrary } from './components/ProjectLibrary';
import { readPdf, type PdfReadResult } from './lib/pdfReader';
import { isGeminiConfigured, isVeoConfigured, refreshStatus } from './lib/gemini';
import { estimateCost } from './lib/videoEngine';
import * as api from './lib/api';
import type { Project, SceneDraft, ProjectStatus, CinematicBible } from './types';

type Screen = 'home' | 'project';

export default function App() {
  // Auth
  const [isAuth, setIsAuth] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [serverStatus, setServerStatus] = useState({
    geminiConfigured: false,
    veoConfigured: false,
    passwordSet: false,
  });

  // Navigation
  const [screen, setScreen] = useState<Screen>('home');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Projects
  const [projects, setProjects] = useState<any[]>([]);

  // Current project state
  const [currentProject, setCurrentProject] = useState<any>(null);

  // UI state
  const [showConfig, setShowConfig] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [isAdapting, setIsAdapting] = useState(false);

  // Selected fragment
  const [selectedFragment, setSelectedFragment] = useState<{ text: string; pages: number[] } | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('cinematográfico realista');

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Poll video status when generating
  useEffect(() => {
    if (!activeProjectId || !isGenerating) return;
    
    const interval = setInterval(async () => {
      try {
        const status = await api.getProjectStatus(activeProjectId);
        setGenerationStatus(`Estado: ${status.status}`);
        
        if (status.status === 'COMPLETED') {
          setIsGenerating(false);
          setGenerationStatus('¡Vídeo completado!');
          loadProject(activeProjectId);
        } else if (status.status === 'FAILED') {
          setIsGenerating(false);
          setGenerationStatus('');
          loadProject(activeProjectId);
        }
      } catch (err) {
        // Ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeProjectId, isGenerating]);

  const checkAuth = async () => {
    try {
      const status = await api.getAuthStatus();
      setIsAuth(status.authenticated);
      setServerStatus({
        geminiConfigured: status.geminiConfigured,
        veoConfigured: status.veoConfigured,
        passwordSet: status.passwordSet,
      });
      await refreshStatus();
    } catch {
      setIsAuth(false);
    } finally {
      setAuthChecked(true);
    }
  };

  const refreshProjects = useCallback(async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.projects);
    } catch {
      setProjects([]);
    }
  }, []);

  const loadProject = async (id: string) => {
    try {
      const data = await api.getProject(id);
      setCurrentProject(data.project);
    } catch (err: any) {
      console.error('Error loading project:', err);
    }
  };

  // Auth handler
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      await api.login(password);
      setIsAuth(true);
      await checkAuth();
      await refreshProjects();
    } catch (err: any) {
      setAuthError(err.message || 'Error de autenticación');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuth(false);
    setScreen('home');
    setActiveProjectId(null);
    setCurrentProject(null);
  };

  // Handle PDF upload
  const handlePdfLoaded = async (result: PdfReadResult, fileName: string, fileSize: number) => {
    // Upload to backend
    try {
      const file = new File([new Blob([])], fileName, { type: 'application/pdf' });
      // We need the actual file, not the result. Let's fix this.
      // The PdfUploader should pass the file directly.
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Handle actual file upload
  const handleFileUpload = async (file: File) => {
    try {
      const result = await api.uploadPdf(file);
      await refreshProjects();
      setActiveProjectId(result.projectId);
      setScreen('project');
    } catch (err: any) {
      alert(`Error subiendo PDF: ${err.message}`);
    }
  };

  // Handle fragment selection
  const handleSelectFragment = (text: string, pageNumbers: number[]) => {
    setSelectedFragment({ text, pages: pageNumbers });
  };

  // Generate scene draft
  const handleGenerateDraft = async () => {
    if (!selectedFragment || !currentProject) return;
    if (!isGeminiConfigured()) {
      alert('Gemini no está configurado en el servidor. Contacta al administrador.');
      return;
    }

    setIsAdapting(true);
    try {
      const result = await api.generateScene(
        currentProject.id,
        selectedFragment.text,
        selectedFragment.pages,
        selectedStyle,
        currentProject.bible
      );

      const updated = {
        ...currentProject,
        scene_draft: result.draft,
        status: 'AWAITING_APPROVAL',
      };

      setCurrentProject(updated);
    } catch (err: any) {
      alert(`Error generando adaptación: ${err.message}`);
    } finally {
      setIsAdapting(false);
    }
  };

  // Approve scene
  const handleApproveScene = async (draft: SceneDraft) => {
    if (!currentProject) return;
    
    try {
      await api.approveScene(currentProject.id, draft);
      const updated = {
        ...currentProject,
        scene_draft: draft,
        approved_prompt: draft.cinematicPrompt,
        status: 'APPROVED',
      };
      setCurrentProject(updated);
    } catch (err: any) {
      alert(`Error aprobando escena: ${err.message}`);
    }
  };

  // Edit scene (local only, approve to save)
  const handleEditScene = (draft: SceneDraft) => {
    if (!currentProject) return;
    setCurrentProject({ ...currentProject, scene_draft: draft });
  };

  // Generate video
  const handleGenerateVideo = async () => {
    if (!currentProject?.scene_draft) return;
    if (!isVeoConfigured()) {
      alert('Veo no está configurado en el servidor. Contacta al administrador.');
      return;
    }

    const confirmMsg = `Se va a generar vídeo con el modelo configurado en el servidor.\n\nEsto puede tener coste económico real.\n¿Confirmas la generación?`;
    if (!confirm(confirmMsg)) return;

    setIsGenerating(true);
    setGenerationStatus('Iniciando generación...');

    try {
      await api.startVideoGeneration(currentProject.id);
      setGenerationStatus('Vídeo en proceso. Consultando estado...');
      
      const updated = { ...currentProject, status: 'GENERATING' };
      setCurrentProject(updated);
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationStatus('');
      alert(`Error iniciando generación: ${err.message}`);
    }
  };

  // Generate bible
  const handleGenerateBible = async () => {
    if (!currentProject) return;
    if (!isGeminiConfigured()) {
      alert('Gemini no está configurado en el servidor.');
      return;
    }

    try {
      const result = await api.generateBible(currentProject.id);
      const updated = { ...currentProject, bible: result.bible };
      setCurrentProject(updated);
    } catch (err: any) {
      alert(`Error generando biblia: ${err.message}`);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return;
    
    try {
      await api.deleteProject(id);
      await refreshProjects();
      if (activeProjectId === id) {
        setActiveProjectId(null);
        setCurrentProject(null);
        setScreen('home');
      }
    } catch (err: any) {
      alert(`Error eliminando proyecto: ${err.message}`);
    }
  };

  // Select project
  const handleSelectProject = async (project: any) => {
    setActiveProjectId(project.id);
    await loadProject(project.id);
    setScreen('project');
  };

  // ===== RENDER =====

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-andalus-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auth screen
  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Clapperboard className="w-8 h-8 text-andalus-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">AL-ANDALUS AI</h1>
            <p className="text-andalus-400 text-sm font-medium tracking-wider mt-1">ANDALUS CINEMA LAB</p>
            <p className="text-gray-500 text-xs mt-3">Acceso privado — Solo el propietario</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña de acceso"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-andalus-500 focus:ring-1 focus:ring-andalus-500/30"
                autoFocus
              />
            </div>
            {authError && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-andalus-600 hover:bg-andalus-500 text-white font-medium rounded-lg transition-all"
            >
              Acceder al laboratorio
            </button>
            {!serverStatus.passwordSet && (
              <p className="text-xs text-andalus-400 text-center">
                Primera vez: esta contraseña se guardará como tu acceso privado.
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Home screen
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clapperboard className="w-6 h-6 text-andalus-400" />
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide">AL-ANDALUS AI</h1>
                <p className="text-xs text-andalus-500 font-medium">ANDALUS CINEMA LAB</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDiagnostics(true)}
                className="p-2 text-gray-500 hover:text-andalus-400 transition-colors"
                title="Diagnóstico"
              >
                <Activity className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowConfig(true)}
                className="p-2 text-gray-500 hover:text-andalus-400 transition-colors"
                title="Configuración"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
          {/* Hero */}
          <section className="text-center space-y-4 py-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              DE TU LIBRO A UNA<br />
              <span className="text-andalus-400">ESCENA CINEMATOGRÁFICA</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Sube tu PDF, selecciona un fragmento, y genera vídeo cinematográfico real con inteligencia artificial.
            </p>
            {(!serverStatus.geminiConfigured || !serverStatus.veoConfigured) && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/30 border border-amber-800/50 rounded-lg text-amber-300 text-sm">
                <AlertTriangle className="w-4 h-4" />
                {!serverStatus.geminiConfigured && 'Gemini no configurado. '}
                {!serverStatus.veoConfigured && 'Veo no configurado. '}
                La IA requiere configuración en el servidor.
              </div>
            )}
          </section>

          {/* Upload section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-andalus-900/50 flex items-center justify-center">
                <span className="text-andalus-400 font-bold text-sm">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Subir PDF</h3>
            </div>
            <PdfUploader
              onPdfLoaded={handlePdfLoaded}
              onFileUpload={handleFileUpload}
              isProcessing={false}
            />
          </section>

          {/* Library */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-andalus-900/50 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-andalus-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Biblioteca privada</h3>
            </div>
            <ProjectLibrary
              projects={projects}
              onSelect={handleSelectProject}
              onDelete={handleDeleteProject}
            />
          </section>

          {/* Workflow steps */}
          <section className="border-t border-gray-800/50 pt-8">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Flujo de trabajo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { step: 'PDF', desc: 'Sube tu obra', icon: '📄' },
                { step: 'TEXTO', desc: 'Extrae y selecciona', icon: '📖' },
                { step: 'ESCENA', desc: 'Adapta con IA', icon: '🎬' },
                { step: 'VÍDEO', desc: 'Genera MP4 real', icon: '🎥' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-gray-900/30 border border-gray-800/50 rounded-xl text-center">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-andalus-400 font-bold text-xs tracking-wider">{item.step}</p>
                  <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Modals */}
        <ConfigPanel isOpen={showConfig} onClose={() => setShowConfig(false)} serverStatus={serverStatus} />
        <DiagnosticPanel isOpen={showDiagnostics} onClose={() => setShowDiagnostics(false)} />
      </div>
    );
  }

  // Project screen
  if (screen === 'project' && currentProject) {
    return (
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setScreen('home'); setActiveProjectId(null); setCurrentProject(null); setSelectedFragment(null); refreshProjects(); }}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-none">{currentProject.name}</h1>
                <p className="text-xs text-gray-500">{currentProject.status?.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowConfig(true)} className="p-2 text-gray-500 hover:text-andalus-400 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
          {/* Status bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {['TEXT_EXTRACTED', 'SCENE_DRAFT', 'AWAITING_APPROVAL', 'APPROVED', 'GENERATING', 'COMPLETED'].map((step, i) => {
              const steps = ['TEXT_EXTRACTED', 'SCENE_DRAFT', 'AWAITING_APPROVAL', 'APPROVED', 'GENERATING', 'COMPLETED'];
              const currentIdx = steps.indexOf(currentProject.status);
              const isActive = i <= currentIdx;
              return (
                <React.Fragment key={step}>
                  <div className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                    ${isActive ? 'bg-andalus-900/50 text-andalus-300 border border-andalus-700/50' : 'bg-gray-900 text-gray-600 border border-gray-800'}
                  `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-andalus-400' : 'bg-gray-700'}`} />
                    {step.replace(/_/g, ' ')}
                  </div>
                  {i < 5 && <ChevronRight className="w-3 h-3 text-gray-700 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step 2: Text viewer */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-andalus-900/50 flex items-center justify-center">
                <span className="text-andalus-400 font-bold text-xs">2</span>
              </div>
              <h3 className="text-base font-semibold text-white">Texto extraído — Selecciona fragmento</h3>
            </div>
            <TextViewer
              pages={currentProject.pages || []}
              fullText={currentProject.full_text || ''}
              onSelectFragment={handleSelectFragment}
            />
            {selectedFragment && (
              <div className="flex items-center gap-3 p-3 bg-andalus-900/20 border border-andalus-800/30 rounded-lg">
                <Eye className="w-4 h-4 text-andalus-400 shrink-0" />
                <p className="text-sm text-andalus-200 flex-1">
                  Fragmento seleccionado: páginas {selectedFragment.pages.join(', ')} — {selectedFragment.text.length.toLocaleString()} caracteres
                </p>
              </div>
            )}
          </section>

          {/* Bible section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-andalus-400" />
                <h3 className="text-base font-semibold text-white">Biblia cinematográfica</h3>
              </div>
              {!currentProject.bible && (
                <button
                  onClick={handleGenerateBible}
                  disabled={!isGeminiConfigured()}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-gray-300 text-xs font-medium rounded-lg transition-all"
                >
                  Generar con IA
                </button>
              )}
            </div>
            {currentProject.bible && (
              <div className="p-4 bg-gray-900/30 border border-gray-800/50 rounded-lg text-sm text-gray-300 space-y-2">
                <p><strong className="text-andalus-300">Personajes:</strong> {currentProject.bible.characters?.map((c: any) => c.name).join(', ')}</p>
                <p><strong className="text-andalus-300">Época:</strong> {currentProject.bible.epoch}</p>
                <p><strong className="text-andalus-300">Estilo:</strong> {currentProject.bible.style}</p>
                <p><strong className="text-andalus-300">Atmósfera:</strong> {currentProject.bible.atmosphere}</p>
              </div>
            )}
          </section>

          {/* Step 3: Scene adaptation */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-andalus-900/50 flex items-center justify-center">
                <span className="text-andalus-400 font-bold text-xs">3</span>
              </div>
              <h3 className="text-base font-semibold text-white">Adaptación a escena</h3>
            </div>

            {/* Style selector */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Estilo:</label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-andalus-500"
              >
                <option value="cinematográfico realista">Cinematográfico realista</option>
                <option value="film noir">Film noir</option>
                <option value="animación artística">Animación artística</option>
                <option value="documental">Documental</option>
                <option value="surrealista">Surrealista</option>
                <option value="épico histórico">Épico histórico</option>
              </select>
            </div>

            {!currentProject.scene_draft ? (
              <div className="space-y-3">
                <button
                  onClick={handleGenerateDraft}
                  disabled={!selectedFragment || isAdapting || !isGeminiConfigured()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-andalus-600 hover:bg-andalus-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
                >
                  {isAdapting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adaptando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generar adaptación con IA
                    </>
                  )}
                </button>
                {!selectedFragment && (
                  <p className="text-xs text-gray-500">Selecciona un fragmento arriba para continuar.</p>
                )}
                {!isGeminiConfigured() && (
                  <p className="text-xs text-amber-400">Gemini no configurado en el servidor.</p>
                )}
              </div>
            ) : (
              <SceneEditor
                draft={currentProject.scene_draft}
                onApprove={handleApproveScene}
                onEdit={handleEditScene}
                isApproved={currentProject.status === 'APPROVED' || currentProject.status === 'GENERATING' || currentProject.status === 'COMPLETED'}
              />
            )}
          </section>

          {/* Step 4: Video generation */}
          {(currentProject.status === 'APPROVED' || currentProject.status === 'QUEUED' || currentProject.status === 'GENERATING' || currentProject.status === 'DOWNLOADING' || currentProject.status === 'COMPLETED' || currentProject.status === 'FAILED') && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-andalus-900/50 flex items-center justify-center">
                  <span className="text-andalus-400 font-bold text-xs">4</span>
                </div>
                <h3 className="text-base font-semibold text-white">Generación de vídeo</h3>
              </div>

              {/* Cost estimate */}
              {currentProject.status === 'APPROVED' && (
                <div className="p-3 bg-gray-900/30 border border-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Modelo:</span>
                    <span className="text-white font-medium">Configurado en servidor</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-400">Duración estimada:</span>
                    <span className="text-white font-medium">~8 segundos</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-400">Coste estimado:</span>
                    <span className="text-andalus-300 font-medium">{estimateCost('veo-2.0-generate-001')}</span>
                  </div>
                </div>
              )}

              {/* Generate button */}
              {currentProject.status === 'APPROVED' && !isGenerating && (
                <button
                  onClick={handleGenerateVideo}
                  className="flex items-center gap-2 px-6 py-3 bg-andalus-600 hover:bg-andalus-500 text-white text-sm font-medium rounded-lg transition-all animate-pulse-glow"
                >
                  <Film className="w-5 h-5" />
                  Generar vídeo real
                </button>
              )}

              {/* Video player */}
              <VideoPlayer
                videoUrl={currentProject.video_path ? api.getVideoUrl(currentProject.id) : null}
                fileName={`${currentProject.name}-scene.mp4`}
                isLoading={isGenerating}
                loadingStatus={generationStatus}
              />

              {/* Error display */}
              {currentProject.status === 'FAILED' && currentProject.error && (
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <p className="text-sm text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {currentProject.error}
                  </p>
                </div>
              )}

              {/* Generation cost */}
              {currentProject.generation_cost && (
                <p className="text-xs text-gray-500">
                  Coste de esta generación: {currentProject.generation_cost}
                </p>
              )}
            </section>
          )}
        </main>

        {/* Config modal */}
        <ConfigPanel isOpen={showConfig} onClose={() => setShowConfig(false)} serverStatus={serverStatus} />
      </div>
    );
  }

  return null;
}
