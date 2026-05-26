'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, ArrowRight, Plus, X, CloudUpload, FileCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../../hooks/useTypedSelector';
import { submitAssignment } from '../../../store/slices/assignmentsSlice';
import type { AssignmentFormData, QuestionType } from '../../../types';

const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions', 'Short Questions', 'Long Answer Questions',
  'Diagrams/Graph-Based Questions', 'Numerical Problems', 'Fill in the Blanks',
  'True/False', 'Essay Questions', 'Case Study', 'Assertion-Reason',
];

const defaultForm = (): AssignmentFormData => ({
  title: '', subject: '', className: '', dueDate: '',
  questionTypes: [
    { id: 1, type: 'Multiple Choice Questions', questions: 4, marks: 1 },
    { id: 2, type: 'Short Questions', questions: 3, marks: 2 },
    { id: 3, type: 'Diagrams/Graph-Based Questions', questions: 5, marks: 5 },
    { id: 4, type: 'Numerical Problems', questions: 5, marks: 5 },
  ],
  additionalInfo: '', file: null,
});

let nextId = 10;

function Counter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))}
        className="w-[26px] h-[26px] border border-[#D0CEC8] rounded-[6px] bg-white cursor-pointer flex items-center justify-center text-[#6B6B6B] hover:border-orange-500 hover:text-orange-500 transition-all text-sm leading-none">−</button>
      <span className="w-8 text-center text-[13px] font-medium text-[#1A1A1A]">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}
        className="w-[26px] h-[26px] border border-[#D0CEC8] rounded-[6px] bg-white cursor-pointer flex items-center justify-center text-[#6B6B6B] hover:border-orange-500 hover:text-orange-500 transition-all text-sm leading-none">+</button>
    </div>
  );
}

export default function CreateAssignmentPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AssignmentFormData>(defaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setForm((f) => ({ ...f, file: accepted[0] }));
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [], 'application/pdf': [] }, maxSize: 5_242_880, maxFiles: 1,
  });

  const totalQ = form.questionTypes.reduce((s, q) => s + q.questions, 0);
  const totalM = form.questionTypes.reduce((s, q) => s + q.questions * q.marks, 0);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.className.trim()) e.className = 'Class is required';
    if (form.questionTypes.length === 0) e.qt = 'Add at least one question type';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (validate()) setStep(2);
  }

  async function handleGenerate() {
    setSubmitting(true);
    try {
      const res = await dispatch(submitAssignment(form)).unwrap();
      toast.success('Assignment queued for AI generation!');
      router.push(`/assignments/generating/${res.assignmentId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create assignment');
      setSubmitting(false);
    }
  }

  function updateQT(id: number, field: keyof QuestionType, val: string | number) {
    setForm((f) => ({ ...f, questionTypes: f.questionTypes.map((q) => q.id === id ? { ...q, [field]: val } : q) }));
  }
  function addQT() {
    setForm((f) => ({ ...f, questionTypes: [...f.questionTypes, { id: nextId++, type: 'Short Questions', questions: 3, marks: 2 }] }));
  }
  function removeQT(id: number) {
    setForm((f) => ({ ...f, questionTypes: f.questionTypes.filter((q) => q.id !== id) }));
  }

  return (
    <div className="max-w-[640px] mx-auto">
      {/* Progress */}
      <div className="h-1 bg-[#E2E0DA] rounded-full mb-7 overflow-hidden">
        <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${(step / 2) * 100}%` }} />
      </div>
      <p className="text-[11px] text-[#9A9A9A] uppercase tracking-[0.5px] mb-1">Step {step} of 2</p>
      <h2 className="text-[20px] font-bold text-[#1A1A1A] mb-1">{step === 1 ? 'Create Assignment' : 'Review & Generate'}</h2>
      <p className="text-[13px] text-[#6B6B6B] mb-5">{step === 1 ? 'Set up a new assignment for your students.' : 'Confirm details before AI generation.'}</p>

      {step === 1 ? (
        <div className="card">
          <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-1">Assignment Details</h3>
          <p className="text-[12px] text-[#9A9A9A] mb-5">Basic information about your assignment</p>

          {/* File Upload */}
          <div {...getRootProps()} className={`border-2 border-dashed rounded-[14px] p-8 text-center cursor-pointer transition-all mb-2 ${isDragActive ? 'border-orange-500 bg-orange-50' : 'border-[#D0CEC8] bg-[#F5F4F0] hover:border-orange-500 hover:bg-orange-50'}`}>
            <input {...getInputProps()} />
            <CloudUpload size={28} className="text-orange-500 mx-auto mb-2.5" />
            <p className="text-[13px] text-[#6B6B6B] mb-1">Choose a file or drag & drop it here</p>
            <span className="text-[11px] text-[#9A9A9A]">PDF, PNG, JPG/JPEG, GIF up to 5MB</span><br />
            <span className="text-[11px] text-orange-500 font-medium cursor-pointer">Browse Files</span>
          </div>
          {form.file && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 bg-green-50 border border-green-200 rounded-[10px] mb-1">
              <FileCheck size={17} className="text-green-600" />
              <span className="text-[12px] text-green-700 font-medium flex-1 truncate">{form.file.name}</span>
              <button type="button" onClick={() => setForm((f) => ({ ...f, file: null }))} className="text-[#9A9A9A] hover:text-red-500 border-none bg-transparent cursor-pointer"><X size={14} /></button>
            </div>
          )}
          <p className="text-[11px] text-[#9A9A9A] mb-4">Upload images of your preferred document/image</p>

          {/* Title + Subject */}
          <div className="grid grid-cols-2 gap-3 mb-3 max-sm:grid-cols-1">
            <div>
              <label className="block text-[11px] font-medium text-[#6B6B6B] uppercase tracking-[0.4px] mb-1.5">Assignment Title *</label>
              <input className="form-input" placeholder="e.g. Quiz on Electricity" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              {errors.title && <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.title}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#6B6B6B] uppercase tracking-[0.4px] mb-1.5">Subject *</label>
              <input className="form-input" placeholder="e.g. Physics / Science" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
              {errors.subject && <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.subject}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 max-sm:grid-cols-1">
            <div>
              <label className="block text-[11px] font-medium text-[#6B6B6B] uppercase tracking-[0.4px] mb-1.5">Class / Grade *</label>
              <input className="form-input" placeholder="e.g. Class 9 / Grade 10" value={form.className} onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))} />
              {errors.className && <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.className}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#6B6B6B] uppercase tracking-[0.4px] mb-1.5">Due Date</label>
              <input type="date" className="form-input cursor-pointer" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>

          {/* Question Types */}
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-[#6B6B6B] uppercase tracking-[0.4px] mb-2">Question Types</label>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-[11px] font-medium text-[#9A9A9A] uppercase tracking-[0.4px] py-2 px-1.5 text-left">Question Type</th>
                  <th className="w-8"></th>
                  <th className="text-[11px] font-medium text-[#9A9A9A] uppercase tracking-[0.4px] py-2 px-1.5 text-left">Questions</th>
                  <th className="text-[11px] font-medium text-[#9A9A9A] uppercase tracking-[0.4px] py-2 px-1.5 text-left">Marks</th>
                </tr>
              </thead>
              <tbody>
                {form.questionTypes.map((qt) => (
                  <tr key={qt.id} className="border-t border-[#F0EFEA] animate-[fadeIn_0.2s_ease]">
                    <td className="py-1.5 px-1.5">
                      <select className="w-full px-2.5 py-2 border border-[#D0CEC8] rounded-[10px] text-[12px] text-[#1A1A1A] bg-white outline-none focus:border-orange-500"
                        value={qt.type} onChange={(e) => updateQT(qt.id, 'type', e.target.value)}>
                        {QUESTION_TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="py-1.5 px-1">
                      <button type="button" onClick={() => removeQT(qt.id)} className="w-6 h-6 border-none bg-transparent cursor-pointer text-[#9A9A9A] hover:text-red-500 hover:bg-red-50 rounded-[4px] flex items-center justify-center transition-all"><X size={13} /></button>
                    </td>
                    <td className="py-1.5 px-1.5"><Counter value={qt.questions} onChange={(v) => updateQT(qt.id, 'questions', v)} /></td>
                    <td className="py-1.5 px-1.5"><Counter value={qt.marks} onChange={(v) => updateQT(qt.id, 'marks', v)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errors.qt && <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors.qt}</p>}
            <button type="button" onClick={addQT} className="flex items-center gap-1.5 text-orange-500 text-[12px] font-medium bg-transparent border-none cursor-pointer mt-2 hover:text-orange-600 transition-colors">
              <Plus size={13} /> Add Question Type
            </button>
            <div className="flex justify-end gap-6 pt-3 border-t border-[#E2E0DA] mt-2 text-[12px] text-[#6B6B6B]">
              <span>Total Questions: <strong className="text-[#1A1A1A]">{totalQ}</strong></span>
              <span>Total Marks: <strong className="text-[#1A1A1A]">{totalM}</strong></span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mb-2">
            <label className="block text-[11px] font-medium text-[#6B6B6B] uppercase tracking-[0.4px] mb-1.5">Additional Information (For better output)</label>
            <textarea className="form-input resize-y min-h-[80px]" placeholder="e.g. Generate a question paper for 3 hour exam duration..."
              value={form.additionalInfo} onChange={(e) => setForm((f) => ({ ...f, additionalInfo: e.target.value }))} />
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-5 pt-4 border-t border-[#E2E0DA]">
            <Link href="/assignments" className="btn-secondary"><ArrowLeft size={13} /> Previous</Link>
            <button type="button" onClick={handleNext} className="btn-primary">Next <ArrowRight size={13} /></button>
          </div>
        </div>
      ) : (
        /* Step 2 - Review */
        <div className="card">
          <div className="grid grid-cols-2 gap-4 mb-5 max-sm:grid-cols-1">
            {[['Title', form.title], ['Subject', form.subject], ['Class', form.className], ['Due Date', form.dueDate || 'Not set']].map(([label, val]) => (
              <div key={label}>
                <p className="text-[11px] text-[#9A9A9A] uppercase tracking-[0.4px] mb-1">{label}</p>
                <p className="text-[14px] font-medium text-[#1A1A1A]">{val}</p>
              </div>
            ))}
          </div>

          <div className="mb-5">
            <p className="text-[11px] text-[#9A9A9A] uppercase tracking-[0.4px] mb-2">Question Types</p>
            {form.questionTypes.map((qt) => (
              <div key={qt.id} className="flex justify-between py-2 border-b border-[#F5F4F0] text-[13px]">
                <span className="text-[#1A1A1A]">{qt.type}</span>
                <span className="text-[#6B6B6B]">{qt.questions} Qs × {qt.marks} mark{qt.marks > 1 ? 's' : ''}</span>
              </div>
            ))}
            <div className="flex justify-end gap-5 pt-2.5 text-[13px] text-[#6B6B6B]">
              <span>Total Qs: <strong className="text-[#1A1A1A]">{totalQ}</strong></span>
              <span>Total Marks: <strong className="text-[#1A1A1A]">{totalM}</strong></span>
            </div>
          </div>

          {form.additionalInfo && (
            <div className="mb-5">
              <p className="text-[11px] text-[#9A9A9A] uppercase tracking-[0.4px] mb-1">Additional Instructions</p>
              <p className="text-[13px] text-[#6B6B6B] bg-[#F5F4F0] p-3 rounded-[8px] leading-relaxed">{form.additionalInfo}</p>
            </div>
          )}

          <div className="flex justify-between items-center mt-5 pt-4 border-t border-[#E2E0DA]">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary"><ArrowLeft size={13} /> Previous</button>
            <button type="button" onClick={handleGenerate} disabled={submitting} className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Queuing...</> : <><span>✨</span> Generate with AI</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
