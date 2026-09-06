export interface Note {
  id: string;
  text: string;
  userId: string;
  userEmail: string;
  createdAt: any;
  aiReflection?: string;
  modelUsed?: string;
  tags?: string[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ChatTurn {
  id: string;
  sender: 'user' | 'gemini';
  content: string;
  timestamp: number;
  modelUsed?: string;
}

export type ReflectionMood = 
  | 'Mindful'
  | 'Grateful'
  | 'Focused'
  | 'Challenged'
  | 'Inspired'
  | 'Reflective'
  | 'Anxious'
  | 'Joyful';

export interface EntrySummary {
  summary: string;
  keyTakeaways: string[];
  tags: string[];
  suggestedAction?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  mood: ReflectionMood;
  turns: ChatTurn[];
  summary?: EntrySummary | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export type JournalInteraction = JournalEntry;

export type GenerationMode = 'reflect' | 'brainstorm' | 'deep_question';
