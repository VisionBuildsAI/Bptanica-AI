

export enum ViewState {
  HERO = 'HERO',
  SCANNING = 'SCANNING',
  RESULT = 'RESULT',
  PESTICIDE_CHECK = 'PESTICIDE_CHECK'
}

export interface User {
  name: string;
  email: string;
}

export interface OrganicTreatment {
  name: string;
  ingredients: { name: string; quantity: string }[];
  preparation_steps: string[];
  application_frequency: string;
  target_pests: string[];
  safety_precautions: string[];
}

export interface ChemicalTreatment {
  product_name: string; // Real names e.g. Imidacloprid
  purpose: string;
  dosage_per_liter: string;
  application_frequency: string;
  waiting_period_days: number;
  safety_warning: string;
}

export interface EmergencyAction {
  action: string; 
  reason: string;
}

export interface DailyCare {
  morning: string[];
  afternoon: string[];
  evening: string[];
  weekly_prevention: string[];
}

export interface PlantDiagnosis {
  plant_name: string;
  disease_name: string;
  is_healthy: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  cause: string;
  spread_risk: string;
  symptoms: string[];
  is_recoverable: boolean;
  recovery_time_days: string;
  organic_treatments: OrganicTreatment[];
  chemical_treatments: ChemicalTreatment[];
  emergency_actions: EmergencyAction[];
  daily_care_plan: DailyCare;
  confidence_score?: number;
}

export interface PesticideAnalysis {
  is_genuine: boolean;
  status: 'GENUINE' | 'FAKE' | 'EXPIRED';
  product_name: string;
  manufacturer: string;
  expiry_date_check: string; // "Valid" or "Expired"
  confidence: number;
  details: string;
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