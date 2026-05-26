import mongoose, { Document, Schema } from 'mongoose';
import type { GeneratedPaper, QuestionType } from '../types/index';

export interface IAssignment extends Document {
  title: string;
  subject: string;
  className: string;
  dueDate?: string;
  questionTypes: QuestionType[];
  additionalInfo?: string;
  fileUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  paper?: GeneratedPaper;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionTypeSchema = new Schema({
  type: { type: String, required: true },
  questions: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 },
}, { _id: false });

const QuestionSchema = new Schema({
  id: Number,
  text: String,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  marks: Number,
}, { _id: false });

const SectionSchema = new Schema({
  id: String,
  title: String,
  instruction: String,
  questionType: String,
  questions: [QuestionSchema],
}, { _id: false });

const GeneratedPaperSchema = new Schema({
  school: String,
  subject: String,
  className: String,
  title: String,
  timeAllowed: String,
  maxMarks: Number,
  totalQuestions: Number,
  generalInstructions: [String],
  sections: [SectionSchema],
}, { _id: false });

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  className: { type: String, required: true, trim: true },
  dueDate: { type: String },
  questionTypes: { type: [QuestionTypeSchema], required: true },
  additionalInfo: { type: String },
  fileUrl: { type: String },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  jobId: { type: String },
  paper: { type: GeneratedPaperSchema },
}, { timestamps: true });

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
