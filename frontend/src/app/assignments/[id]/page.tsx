'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Download, Star, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../../hooks/useTypedSelector';
import { loadAssignment } from '../../../store/slices/assignmentsSlice';
import { getPDFUrl } from '../../../utils/api';
import type { Section, Question } from '../../../types';

function DifficultyBadge({ diff }: { diff: string }) {
  const cls = {
    Easy: 'diff-easy', Medium: 'diff-medium', Hard: 'diff-hard',
  }[diff] ?? 'diff-medium';
  return <span className={cls}>{diff}</span>;
}

function QuestionItem({ q, num }: { q: Question; num: number }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-[#F5F4F0] last:border-0">
      <div className="w-6 h-6 rounded-full bg-[#F5F4F0] flex items-center justify-center text-[11px] font-semibold text-[#6B6B6B] flex-shrink-0 mt-px">
        {num}
      </div>
      <div className="flex-1">
        <p className="text-[13px] text-[#1A1A1A] leading-relaxed mb-1.5">{q.text}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <DifficultyBadge diff={q.difficulty} />
          <span className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
            <Star size={10} fill="currentColor" className="text-yellow-500" />
            <strong className="text-[#1A1A1A]">{q.marks}</strong> mark{q.marks > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: Section }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-3 mb-3">
        <span className="bg-[#1A1A1A] text-white text-[12px] font-bold px-3 py-1 rounded-[4px] tracking-wide">{section.id}</span>
        <span className="text-[14px] font-semibold text-[#1A1A1A]">{section.title}</span>
        <span className="text-[12px] text-[#9A9A9A]">— {section.questionType}</span>
      </div>
      {section.instruction && (
        <p className="text-[11px] text-[#6B6B6B] italic mb-3 pl-1">{section.instruction}</p>
      )}
      <div>
        {section.questions.map((q, i) => (
          <QuestionItem key={q.id} q={q} num={i + 1} />
        ))}
      </div>
    </div>
  );
}

export default function AssignmentOutputPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const assignmentId = params.id as string;
  const assignment = useAppSelector((s) => s.assignments.currentAssignment);
  const loading = useAppSelector((s) => s.assignments.loading);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(loadAssignment(assignmentId));
  }, [assignmentId, dispatch]);

  const paper = assignment?.paper;

  if (loading && !paper) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle size={40} className="text-yellow-500 mb-4" />
        <h3 className="text-[16px] font-semibold mb-2">Paper not ready yet</h3>
        <p className="text-[13px] text-[#6B6B6B] mb-4">The question paper may still be generating.</p>
        <button onClick={() => router.back()} className="btn-secondary"><ArrowLeft size={13} /> Go Back</button>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    toast.success('Downloading PDF…');
    window.open(getPDFUrl(assignmentId), '_blank');
  };

  const handleRegenerate = () => {
    router.push('/assignments/create');
    toast('Edit your assignment and regenerate', { icon: '🔄' });
  };

  return (
    <div className="max-w-[760px] mx-auto">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3 no-print">
        <button onClick={() => router.push('/assignments')} className="btn-secondary"><ArrowLeft size={13} /> Back</button>
        <div className="flex items-center gap-2">
          <button onClick={handleRegenerate} className="btn-secondary"><RefreshCw size={13} /> Regenerate</button>
          <button onClick={handleDownloadPDF} className="btn-primary"><Download size={13} /> Download PDF</button>
        </div>
      </div>

      {/* Question Paper */}
      <div ref={printRef} className="bg-white border border-[#E2E0DA] rounded-[20px] overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-[#1A1A1A] text-white px-8 py-6 text-center">
          <h2 className="font-serif text-[18px] font-normal mb-1 tracking-[0.3px]">{paper.school}</h2>
          <h3 className="text-[13px] font-normal opacity-70 mb-1">Subject: {paper.subject} &nbsp;|&nbsp; Class: {paper.className}</h3>
          <h4 className="text-[12px] font-normal opacity-55">{paper.title}</h4>
        </div>

        {/* Meta */}
        <div className="flex justify-between px-8 py-3.5 bg-[#F9F8F5] border-b border-[#E2E0DA] text-[12px] text-[#6B6B6B]">
          <span>⏱ Time Allowed: <strong className="text-[#1A1A1A]">{paper.timeAllowed}</strong></span>
          <span>Maximum Marks: <strong className="text-[#1A1A1A]">{paper.maxMarks}</strong></span>
        </div>

        {/* General Instructions */}
        {paper.generalInstructions?.length > 0 && (
          <div className="px-8 py-3.5 bg-[#FFFDF8] border-b border-[#E2E0DA]">
            <p className="text-[12px] font-semibold text-[#1A1A1A] mb-1.5">General Instructions:</p>
            {paper.generalInstructions.map((inst, i) => (
              <p key={i} className="text-[12px] text-[#6B6B6B] italic ml-3">{i + 1}. {inst}</p>
            ))}
          </div>
        )}

        {/* Student Info */}
        <div className="px-8 py-4 border-b border-[#E2E0DA] grid grid-cols-3 gap-4 max-sm:grid-cols-1">
          {[['Name', '____________________________'], ['Roll Number', '_______________'], ['Section', '________']].map(([label, blank]) => (
            <div key={label} className="border-b border-[#1A1A1A] pb-1 flex justify-between items-end">
              <span className="text-[11px] text-[#6B6B6B] font-medium">{label}</span>
              <span className="text-[11px] text-[#AAAAAA]">{blank}</span>
            </div>
          ))}
        </div>

        {/* Question Sections */}
        <div className="px-8 py-6">
          {paper.sections.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-[#E2E0DA] text-center bg-[#FAFAF8]">
          <p className="text-[11px] text-[#AAAAAA]">— End of Question Paper —</p>
          <p className="text-[11px] text-[#CCCCCC] mt-1">Generated by VedaAI · Delhi Public School</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 max-sm:grid-cols-1">
        {[
          { label: 'Total Questions', value: paper.totalQuestions },
          { label: 'Total Marks', value: paper.maxMarks },
          { label: 'Sections', value: paper.sections.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-[#E2E0DA] rounded-[12px] p-4 text-center">
            <p className="text-[22px] font-bold text-orange-500">{value}</p>
            <p className="text-[12px] text-[#6B6B6B] mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
