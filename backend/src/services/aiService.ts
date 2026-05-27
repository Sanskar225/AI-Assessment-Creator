import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeneratedPaper, QuestionType } from '../types/index';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ''
);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

function buildPrompt(params: {
  title: string;
  subject: string;
  className: string;
  questionTypes: QuestionType[];
  additionalInfo?: string;
}): string {
  const totalQ = params.questionTypes.reduce(
    (s, qt) => s + qt.questions,
    0
  );

  const totalM = params.questionTypes.reduce(
    (s, qt) => s + qt.questions * qt.marks,
    0
  );

  const timeAllowed = Math.max(40, totalQ * 2);

  return `
You are an expert Indian school teacher creating a structured examination question paper.

Generate a complete, well-organized question paper.

Specifications:
- School: Delhi Public School
- Subject: ${params.subject}
- Class: ${params.className}
- Assignment Title: ${params.title}
- Total Questions: ${totalQ}
- Total Marks: ${totalM}
- Time Allowed: ${timeAllowed} minutes

Question Types Required:
${params.questionTypes
  .map(
    (qt) =>
      `- ${qt.type}: ${qt.questions} questions, ${qt.marks} marks each`
  )
  .join('\n')}

${params.additionalInfo
    ? `Additional Instructions: ${params.additionalInfo}`
    : ''}

IMPORTANT RULES:
1. Each question type becomes its own Section
2. Difficulty MUST be exactly one of:
   - Easy
   - Medium
   - Hard
3. Questions must be curriculum appropriate
4. Return ONLY valid JSON
5. No markdown
6. No explanation

Required JSON structure:

{
  "school": "Delhi Public School",
  "subject": "${params.subject}",
  "className": "${params.className}",
  "title": "${params.title}",
  "timeAllowed": "${timeAllowed} minutes",
  "maxMarks": ${totalM},
  "totalQuestions": ${totalQ},
  "generalInstructions": [
    "All questions are compulsory unless stated otherwise.",
    "Read all questions carefully before answering."
  ],
  "sections": [
    {
      "id": "A",
      "title": "Section A",
      "instruction": "Attempt all questions.",
      "questionType": "Multiple Choice Questions",
      "questions": [
        {
          "id": 1,
          "text": "Question text",
          "difficulty": "Easy",
          "marks": 1
        }
      ]
    }
  ]
}
`;
}

export async function generateQuestionPaper(params: {
  title: string;
  subject: string;
  className: string;
  questionTypes: QuestionType[];
  additionalInfo?: string;
  onProgress?: (step: string, progress: number) => void;
}): Promise<GeneratedPaper> {
  const { onProgress } = params;

  onProgress?.('Analyzing assignment requirements', 10);

  const prompt = buildPrompt(params);

  onProgress?.('Connecting to Gemini AI', 25);

  onProgress?.('Generating questions with AI', 40);

  const result = await model.generateContent(prompt);

  const response = await result.response;

  const fullText = response.text();

  onProgress?.('Parsing and structuring response', 85);

  let paper: GeneratedPaper;

  try {
    const clean = fullText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    paper = JSON.parse(clean) as GeneratedPaper;
  } catch {
    const match = fullText.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error('Failed to parse AI response as JSON');
    }

    paper = JSON.parse(match[0]) as GeneratedPaper;
  }

  // Validate structure
  if (!paper.sections || !Array.isArray(paper.sections)) {
    throw new Error('Invalid paper structure: missing sections');
  }

  // Normalize difficulty
  paper.sections = paper.sections.map((section) => ({
    ...section,
    questions: section.questions.map((q) => ({
      ...q,
      difficulty: normalizeDifficulty(q.difficulty),
    })),
  }));

  onProgress?.('Finalizing question paper', 95);

  return paper;
}

function normalizeDifficulty(
  d: string
): 'Easy' | 'Medium' | 'Hard' {
  const lower = (d || '').toLowerCase();

  if (lower === 'easy') return 'Easy';

  if (lower === 'hard') return 'Hard';

  return 'Medium';
}