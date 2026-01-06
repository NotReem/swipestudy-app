
export interface Flashcard {
  id: string;
  folderId: string;
  front: string;
  back: string;
  status: 'new' | 'learning' | 'mastered';
  nextReview: number;
  interval: number;
  masteryScore: number; // 0 to 3, 3 is mastered
  lastAttemptCorrect?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export type AppView = 'dashboard' | 'scanner' | 'study' | 'calculator' | 'solver' | 'profile' | 'learn' | 'test';

export type StudyMode = 'focused' | 'random' | 'scheduled' | 'learn' | 'test';

export type QuestionType = 'multiple-choice' | 'true-false' | 'written';

export interface StudyConfig {
  questionTypes: QuestionType[];
  itemCount: number;
}

export interface User {
  name: string;
  email: string;
}

export interface GradeState {
  currentGrade: number;
  targetGrade: number;
  finalWeight: number;
}

export interface TestQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string;
  isTrue?: boolean; // For T/F
}

export interface TestResult {
  score: number;
  feedback: string;
  answers: { questionId: string; userAnswer: string; isCorrect: boolean; feedback?: string }[];
}
