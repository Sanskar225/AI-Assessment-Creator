export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuestionType {
  type: string;
  questions: number;
  marks: number;
}

export interface CreateAssignmentDto {
  title: string;
  subject: string;
  className: string;
  dueDate?: string;
  questionTypes: QuestionType[];
  additionalInfo?: string;
  fileUrl?: string;
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

export interface WSMessage {
  type: 'JOB_PROGRESS' | 'JOB_COMPLETE' | 'JOB_ERROR' | 'CONNECTED';
  payload: JobProgress | { message: string };
}
