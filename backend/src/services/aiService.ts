import Anthropic from '@anthropic-ai/sdk';
import type { GeneratedPaper, QuestionType } from '../types/index';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildPrompt(params: {
  title: string;
  subject: string;
  className: string;
  questionTypes: QuestionType[];
  additionalInfo?: string;
}): string {
  const totalQ = params.questionTypes.reduce((s, qt) => s + qt.questions, 0);
  const totalM = params.questionTypes.reduce((s, qt) => s + qt.questions * qt.marks, 0);
  const timeAllowed = Math.max(40, totalQ * 2);

  return `You are an expert Indian school teacher creating a structured examination question paper. Generate a complete, well-organized question paper.

Specifications:
- School: Delhi Public School
- Subject: ${params.subject}
- Class: ${params.className}
- Assignment Title: ${params.title}
- Total Questions: ${totalQ}
- Total Marks: ${totalM}
- Time Allowed: ${timeAllowed} minutes

Question Types Required:
${params.questionTypes.map((qt) => `- ${qt.type}: ${qt.questions} questions, ${qt.marks} mark${qt.marks > 1 ? 's' : ''} each`).join('\n')}

${params.additionalInfo ? `Additional Instructions: ${params.additionalInfo}` : ''}

IMPORTANT RULES:
1. Each question type becomes its own Section (A, B, C, D, etc.)
2. Difficulty MUST be exactly one of: "Easy", "Medium", or "Hard"
3. Questions must be real, curriculum-appropriate, and intellectually rigorous
4. Vary difficulty across questions in each section
5. For MCQs, write the question only (no options needed)
6. Return ONLY valid JSON, no markdown, no preamble, no explanation

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
    "Read all questions carefully before answering.",
    "Write all answers clearly and legibly.",
    "Show all working for numerical problems."
  ],
  "sections": [
    {
      "id": "A",
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X mark(s).",
      "questionType": "Multiple Choice Questions",
      "questions": [
        {
          "id": 1,
          "text": "Full question text here",
          "difficulty": "Easy",
          "marks": 1
        }
      ]
    }
  ]
}`;
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

  onProgress?.('Connecting to AI model', 25);

  let fullText = '';

  onProgress?.('Generating questions with AI', 40);

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  let chunkCount = 0;
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      fullText += chunk.delta.text;
      chunkCount++;
      if (chunkCount % 20 === 0) {
        const progress = Math.min(40 + Math.floor((chunkCount / 200) * 40), 80);
        onProgress?.('Generating questions with AI', progress);
      }
    }
  }

  onProgress?.('Parsing and structuring response', 85);

  let paper: GeneratedPaper;
  try {
    const clean = fullText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
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

  // Normalize difficulty values
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

function normalizeDifficulty(d: string): 'Easy' | 'Medium' | 'Hard' {
  const lower = (d || '').toLowerCase();
  if (lower === 'easy') return 'Easy';
  if (lower === 'hard') return 'Hard';
  return 'Medium';
}
