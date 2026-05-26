export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuestionType {
  id: number;
  type: string;
  questions: number;
  marks: number;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInfo: string;
  file: File | null;
}

export interface Question {
  id: number;
  text: string;
  difficulty: Difficulty;
  marks: number;
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  questionType: string;
  questions: Question[];
}

export interface GeneratedPaper {
  school: string;
  subject: string;
  className: string;
  title: string;
  timeAllowed: string;
  maxMarks: number;
  totalQuestions: number;
  generalInstructions: string[];
  sections: Section[];
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  className: string;
  dueDate?: string;
  questionTypes: Omit<QuestionType, 'id'>[];
  additionalInfo?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  paper?: GeneratedPaper;
  createdAt: string;
  updatedAt: string;
}

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed';

export interface JobProgress {
  jobId: string;
  assignmentId: string;
  status: JobStatus;
  progress: number;
  step: string;
  error?: string;
  result?: GeneratedPaper;
}

export type WSMessage =
  | { type: 'CONNECTED'; payload: { message: string } }
  | { type: 'JOB_PROGRESS'; payload: JobProgress }
  | { type: 'JOB_COMPLETE'; payload: JobProgress }
  | { type: 'JOB_ERROR'; payload: JobProgress };
