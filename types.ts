
export enum ViewState {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  ANALYSIS = 'ANALYSIS',
  LIVE = 'LIVE'
}

export interface CareInstructions {
  water: string;
  sunlight: string;
  soil: string;
  fertilizer: string;
  temperature: string;
}

export interface DiseaseDiagnosis {
  has_disease: boolean;
  disease_name?: string;
  symptoms?: string;
  cure_instructions?: string[];
  preventative_measures?: string[];
  confidence_score?: number;
}

export interface PlantAnalysis {
  name: string;
  scientific_name: string;
  description: string;
  care: CareInstructions;
  diagnosis: DiseaseDiagnosis;
  planting_guide: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface FileUpload {
  file: File;
  previewUrl: string;
}

export interface User {
  name: string;
  email: string;
}
