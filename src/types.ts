

export enum Framework {
  BASIC = 'BASIC',
  BSI = 'BSI',
  NIS2 = 'NIS2',
  ISO27001 = 'ISO27001',
  GDPR = 'GDPR',
  CIS = 'CIS'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'IT_PROVIDER' | 'VIEWER';

export interface CoachingState {
  isActive: boolean;
  streakDays: number;
  lastInteraction: Date;
  notificationsEnabled: boolean;
}

export interface User {
  id: string;
  username?: string; // Optional display name
  email: string; // Mandatory for login
  role: UserRole;
  encryptionKey: string; // Changed from CryptoKey to string (Base64) for serialization
  avatar?: string;
  
  // New Security Fields
  lastLogin?: Date;
  validUntil?: Date | null; // null = unlimited
  failedLoginAttempts?: number;
  lastFailedLogin?: Date;
  isLocked?: boolean;
  
  // Regulatory Relevance
  isNis2Relevant?: boolean;

  // Gamification / Coaching
  coaching?: CoachingState;
}

export interface TaskDocument {
  id: string;
  name: string;
  type: string;
  data: string; // Base64
  uploadedAt: Date;
  aiVerification?: {
    verified: boolean;
    reason: string;
    timestamp: Date;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: string;
  framework: Framework;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation?: string;
  source?: 'DEFAULT' | 'GENERATOR' | 'ONBOARDING' | 'CATALOG';
  documents?: TaskDocument[];
}

export interface RoadmapPhase {
  title: string;
  timeframe: string;
  description: string;
  taskIds: string[];
}

export interface Roadmap {
  phases: RoadmapPhase[];
  generatedAt: Date;
}

export interface CategoryStats {
  category: string;
  total: number;
  completed: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// AI Configuration Types
export type AiProvider = 'CLOUD' | 'OLLAMA';

export interface AiConfig {
  provider: AiProvider;
  geminiApiKey?: string;
  ollamaUrl: string;   // e.g. http://localhost:11434
  ollamaModel: string; // e.g. llama3, mistral
}