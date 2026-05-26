import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  createAssignment,
  getAssignments,
  getAssignment,
  getAssignmentStatus,
  deleteAssignment,
  downloadAssignmentPDF,
} from '../controllers/assignmentController.js';
import { createAssignmentValidators, handleValidationErrors } from '../middleware/validate.js';

const router = Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.get('/', getAssignments);
router.post('/', upload.single('file'), createAssignmentValidators, handleValidationErrors, createAssignment);
router.get('/:id', getAssignment);
router.get('/:id/status', getAssignmentStatus);
router.delete('/:id', deleteAssignment);
router.get('/:id/pdf', downloadAssignmentPDF);

export default router;
