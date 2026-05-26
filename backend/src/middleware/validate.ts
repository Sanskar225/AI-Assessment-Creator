import { Request, Response, NextFunction } from 'express';
import { validationResult, body } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

export const createAssignmentValidators = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('className').trim().notEmpty().withMessage('Class is required'),
  body('questionTypes')
    .isArray({ min: 1 })
    .withMessage('At least one question type is required'),
  body('questionTypes.*.type').trim().notEmpty().withMessage('Question type name required'),
  body('questionTypes.*.questions')
    .isInt({ min: 1, max: 50 })
    .withMessage('Questions must be between 1 and 50'),
  body('questionTypes.*.marks')
    .isInt({ min: 1, max: 100 })
    .withMessage('Marks must be between 1 and 100'),
];
