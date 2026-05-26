import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient } from '../utils/redis';
import { generateQuestionPaper } from './aiService';
import { Assignment } from '../models/Assignment';
import { broadcastJobProgress, broadcastJobComplete, broadcastJobError } from '../utils/websocket';
import type { JobProgress } from '../types/index';

export const GENERATION_QUEUE = 'generation';

let generationQueue: Queue | null = null;

export function getGenerationQueue(): Queue {
  if (!generationQueue) {
    const connection = getRedisClient();
    generationQueue = new Queue(GENERATION_QUEUE, {
  connection: connection as any,
});
  }
  return generationQueue;
}

export async function addGenerationJob(assignmentId: string): Promise<string> {
  const queue = getGenerationQueue();
  const job = await queue.add(
    'generate',
    { assignmentId },
    {
      attempts: 2,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );
  return job.id as string;
}

export function startWorker(): Worker {
  const connection = getRedisClient();

  const worker = new Worker(
    GENERATION_QUEUE,
    async (job: Job) => {
      const { assignmentId } = job.data as { assignmentId: string };

      const sendProgress = (step: string, progress: number, status: JobProgress['status'] = 'active') => {
        const payload: JobProgress = {
          jobId: job.id as string,
          assignmentId,
          status,
          progress,
          step,
        };
        broadcastJobProgress(assignmentId, payload);
      };

      try {
        sendProgress('Looking up assignment', 5);

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

        await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing', jobId: job.id });

        const paper = await generateQuestionPaper({
          title: assignment.title,
          subject: assignment.subject,
          className: assignment.className,
          questionTypes: assignment.questionTypes,
          additionalInfo: assignment.additionalInfo,
          onProgress: sendProgress,
        });

        await Assignment.findByIdAndUpdate(assignmentId, {
          status: 'completed',
          paper,
        });

        const completePayload: JobProgress = {
          jobId: job.id as string,
          assignmentId,
          status: 'completed',
          progress: 100,
          step: 'Question paper ready!',
          result: paper,
        };
        broadcastJobComplete(assignmentId, completePayload);

        return paper;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });

        const errorPayload: JobProgress = {
          jobId: job.id as string,
          assignmentId,
          status: 'failed',
          progress: 0,
          step: 'Generation failed',
          error: errMsg,
        };
        broadcastJobError(assignmentId, errorPayload);
        throw error;
      }
    },
    {
  connection: connection as any,
  concurrency: 2,
}
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err.message);
  });

  console.log('🔧 BullMQ Worker started');
  return worker;
}
