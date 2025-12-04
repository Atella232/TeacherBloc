
export interface ClassGroup {
  id?: string;
  ownerId: string;
  name: string; // e.g. "3º ESO B"
  subject?: string; // e.g. "Matemáticas"
  createdAt: number;
}

export interface Student {
  id?: string;
  ownerId: string;
  firstName: string;
  lastName: string;
  groups: string[]; // Array of ClassGroup IDs
  specialNeeds: string[];
  contactInfo: string;
  createdAt: number; // Timestamp
}

export interface Grade {
  id?: string;
  ownerId: string;
  studentId: string;
  classGroupId: string;
  title: string; // "Examen Tema 1" or "Evaluación Final"
  grade: number;
  type: 'exam' | 'work' | 'final';
  date: number;
}

export interface FollowUpNote {
  id?: string;
  ownerId: string;
  studentId: string;
  title: string;
  content: string; // Long text
  date: number;
}

export type InterventionType = "Conducta" | "Académico" | "Familia" | "Positivo";
export type InterventionStatus = "pendiente" | "resuelto";

export interface Intervention {
  id?: string;
  ownerId: string;
  studentId: string;
  studentName: string; // Denormalized
  type: InterventionType;
  description: string;
  date: number; // Timestamp
  status: InterventionStatus;
}

export interface Resource {
  id?: string;
  ownerId: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
}

export interface QuickNote {
  id?: string;
  ownerId: string;
  content: string;
  color: string;
  isArchived: boolean;
  createdAt: number;
}

export interface CalendarEvent {
  id?: string;
  ownerId: string;
  title: string;
  date: number; // Timestamp (start of day)
  type: 'general' | 'exam' | 'meeting';
  linkedNoteId?: string; // Optional link to a quick note
}
