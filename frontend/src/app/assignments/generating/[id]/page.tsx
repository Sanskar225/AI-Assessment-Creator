'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../../../hooks/useTypedSelector';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { loadAssignment } from '../../../store/slices/assignmentsSlice';
import { CheckCircle2, Circle, Loader2, Wifi } from 'lucide-react';

const STEPS = [
  'Looking up assignment',
  'Analyzing requirements',
  'Generating questions with AI',
  'Applying difficulty levels',
  'Formatting final paper',
  'Question paper ready!',
];

export default function GeneratingPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;
  const dispatch = useAppDispatch();
  const jobProgress = useAppSelector((s) => s.assignments.jobProgress);
  const wsConnected = useAppSelector((s) => s.assignments.wsConnected);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to WebSocket for this assignment
  useWebSocket(assignmentId);

  // Poll as fallback
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const a = await dispatch(loadAssignment(assignmentId)).unwrap();
        if (a.status === 'completed') {
          clearInterval(pollRef.current!);
          router.push(`/assignments/${assignmentId}`);
        } else if (a.status === 'failed') {
          clearInterval(pollRef.current!);
          router.push('/assignments');
        }
      } catch {}
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [assignmentId, dispatch, router]);

  // React to WS job complete
  useEffect(() => {
    if (jobProgress?.status === 'completed' && jobProgress.assignmentId === assignmentId) {
      router.push(`/assignments/${assignmentId}`);
    } else if (jobProgress?.status === 'failed' && jobProgress.assignmentId === assignmentId) {
      router.push('/assignments');
    }
  }, [jobProgress, assignmentId, router]);

  const progress = jobProgress?.assignmentId === assignmentId ? jobProgress.progress : 0;
  const currentStep = jobProgress?.assignmentId === assignmentId ? jobProgress.step : 'Initializing...';

  const activeStepIndex = STEPS.findIndex((s) =>
    currentStep.toLowerCase().includes(s.split(' ')[0].toLowerCase())
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center max-w-[400px] mx-auto">
      {/* Spinner */}
      <div className="relative mb-6">
        <div className="w-[72px] h-[72px] rounded-full border-4 border-[#E2E0DA] border-t-orange-500 animate-spin-smooth" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-semibold text-orange-500">{progress}%</span>
        </div>
      </div>

      <h3 className="text-[18px] font-bold text-[#1A1A1A] mb-2">Generating Question Paper</h3>
      <p className="text-[13px] text-[#6B6B6B] mb-6">Our AI is crafting your personalized assessment…</p>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#E2E0DA] rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Steps */}
      <div className="w-full text-left space-y-2 mb-6">
        {STEPS.map((step, i) => {
          const isDone = activeStepIndex > i || progress === 100;
          const isActive = activeStepIndex === i && progress < 100;
          return (
            <div key={step} className={`flex items-center gap-3 py-1.5 text-[13px] transition-colors ${isDone ? 'text-green-600' : isActive ? 'text-[#1A1A1A] font-medium' : 'text-[#9A9A9A]'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-green-100' : isActive ? 'bg-orange-50' : 'bg-[#F5F4F0]'}`}>
                {isDone ? <CheckCircle2 size={14} className="text-green-600" /> : isActive ? <Loader2 size={12} className="text-orange-500 animate-spin" /> : <Circle size={12} className="text-[#D0CEC8]" />}
              </div>
              {step}
            </div>
          );
        })}
      </div>

      {/* WS badge */}
      <div className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border ${wsConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-[#F5F4F0] border-[#E2E0DA] text-[#9A9A9A]'}`}>
        <Wifi size={11} />
        {wsConnected ? 'Connected · Processing in background' : 'Connecting…'}
      </div>
    </div>
  );
}
