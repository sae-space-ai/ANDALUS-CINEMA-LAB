export type ProjectStatus =
  | 'CREATED'
  | 'UPLOADED'
  | 'TEXT_EXTRACTED'
  | 'SCENE_DRAFT'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'QUEUED'
  | 'GENERATING'
  | 'DOWNLOADING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'CANCELLED';

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  pdfFileName: string;
  pdfFileSize: number;
  pdfChecksum: string;
  pages: PdfPage[];
  fullText: string;
  rightsConfirmed: boolean;
  sceneDraft: SceneDraft | null;
  approvedPrompt: string | null;
  videoModel: string | null;
  videoUrl: string | null;
  videoDuration: number | null;
  videoFileSize: number | null;
  error: string | null;
  bible: CinematicBible | null;
  generationCost: string | null;
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
  characters: BibleCharacter[];
  scenarios: string[];
  epoch: string;
  atmosphere: string;
  style: string;
  relationships: string[];
  narrativeReferences: string[];
}

export interface BibleCharacter {
  name: string;
  visualTraits: string;
  wardrobe: string;
  description: string;
}

export interface GenerationConfig {
  textModel: string;
  videoModel: string;
  resolution: string;
  duration: string;
  style: string;
}

export interface DiagnosticItem {
  name: string;
  status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'VERIFIED' | 'FAILED';
  detail: string;
}
