
export interface Flashcard {
  id: string;
  folderId: string;
  front: string;
  back: string;
  status: 'new' | 'known' | 'review';
  nextReview: number; // timestamp
  interval: number; // days
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export type AppView = 'dashboard' | 'scanner' | 'study' | 'calculator' | 'solver' | 'profile';

export type StudyMode = 'focused' | 'random' | 'scheduled';

export interface User {
  name: string;
  email: string;
}

export interface GradeState {
  currentGrade: number;
  targetGrade: number;
  finalWeight: number;
}
