import { Request, Response } from 'express';
import { Assignment } from '../models/Assignment';
import { addGenerationJob } from '../services/queueService';
import { generatePDF } from '../services/pdfService';
import { cacheGet, cacheSet, cacheDel } from '../utils/redis';
import type { CreateAssignmentDto } from '../types/index';

const CACHE_TTL = 300; // 5 minutes

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {

    // Parse questionTypes from FormData string
    if (typeof req.body.questionTypes === 'string') {
      req.body.questionTypes = JSON.parse(req.body.questionTypes);
    }

    const dto: CreateAssignmentDto = req.body;

    const assignment = new Assignment({
      title: dto.title,
      subject: dto.subject,
      className: dto.className,
      dueDate: dto.dueDate,
      questionTypes: dto.questionTypes,
      additionalInfo: dto.additionalInfo,
      fileUrl: (req.file as Express.Multer.File | undefined)?.path,
      status: 'pending',
    });

    await assignment.save();

    // Add to BullMQ queue
    const jobId = await addGenerationJob(String(assignment._id));
    await Assignment.findByIdAndUpdate(assignment._id, { jobId });

    // Invalidate list cache
    await cacheDel('assignments:list');

    res.status(201).json({
      success: true,
      data: {
        assignmentId: String(assignment._id),
        jobId,
        status: 'pending',
        message: 'Assignment created and generation job queued',
      },
    });
  } catch (error) {
    console.error('createAssignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create assignment' });
  }
};

export const getAssignments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cached = await cacheGet<unknown[]>('assignments:list');
    if (cached) {
      res.json({ success: true, data: cached, cached: true });
      return;
    }

    const assignments = await Assignment.find({}, '-paper.sections.questions.text')
      .sort({ createdAt: -1 })
      .limit(100);

    await cacheSet('assignments:list', assignments, CACHE_TTL);

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('getAssignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
  }
};

export const getAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cacheKey = `assignment:${id}`;

    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached, cached: true });
      return;
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found' });
      return;
    }

    if (assignment.status === 'completed') {
      await cacheSet(cacheKey, assignment, CACHE_TTL);
    }

    res.json({ success: true, data: assignment });
  } catch (error) {
    console.error('getAssignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignment' });
  }
};

export const getAssignmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(
      id,
      'status jobId title subject'
    );

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        status: assignment.status,
        jobId: assignment.jobId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get status',
    });
  }
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByIdAndDelete(id);

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
      return;
    }

    await cacheDel(`assignment:${id}`);
    await cacheDel('assignments:list');

    res.json({
      success: true,
      message: 'Assignment deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
    });
  }
};

export const downloadAssignmentPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
      return;
    }

    if (assignment.status !== 'completed' || !assignment.paper) {
      res.status(400).json({
        success: false,
        message: 'Paper not yet generated',
      });
      return;
    }

    generatePDF(assignment.paper, res);
  } catch (error) {
    console.error('downloadPDF error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
    });
  }
};