import type { Difficulty, Question, QuestionGenerationConfig, QuestionType, Subject } from '../types';

const QUESTION_TYPES: QuestionType[] = ['choice', 'fillblank', 'spelling'];
const SUBJECTS: Subject[] = ['chinese', 'math', 'english'];
const DIFFICULTIES: Difficulty[] = [1, 2, 3];

export class ParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParserError';
  }
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new ParserError('Empty response');
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : trimmed;

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown JSON parse error';
    throw new ParserError(`Invalid JSON: ${message}`);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateChoiceAnswer(answer: unknown, options: unknown[]): answer is number {
  return (
    typeof answer === 'number' &&
    Number.isInteger(answer) &&
    answer >= 0 &&
    answer < options.length
  );
}

function validateString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateRawQuestion(item: unknown): item is {
  type: QuestionType;
  question: string;
  options?: string[];
  answer: number | string;
  explanation: string;
} {
  if (!isPlainObject(item)) {
    return false;
  }

  if (!validateString(item.type) || !QUESTION_TYPES.includes(item.type as QuestionType)) {
    return false;
  }

  if (!validateString(item.question)) {
    return false;
  }

  if (!validateString(item.explanation)) {
    return false;
  }

  if (item.type === 'choice') {
    if (!Array.isArray(item.options) || item.options.length !== 4) {
      return false;
    }
    if (!item.options.every((opt) => validateString(opt))) {
      return false;
    }
    if (!validateChoiceAnswer(item.answer, item.options)) {
      return false;
    }
  } else {
    if (!validateString(item.answer)) {
      return false;
    }
  }

  return true;
}

export interface ValidationResult {
  valid: Question[];
  invalid: number;
  error?: string;
}

export function validateQuestions(
  raw: unknown,
  config: QuestionGenerationConfig
): ValidationResult {
  if (!Array.isArray(raw)) {
    return { valid: [], invalid: 0, error: 'Expected a JSON array of questions' };
  }

  if (!SUBJECTS.includes(config.subject) || !DIFFICULTIES.includes(config.difficulty)) {
    return { valid: [], invalid: 0, error: 'Invalid generation config' };
  }

  const valid: Question[] = [];
  let invalid = 0;
  const generatedAt = Date.now();

  for (const item of raw) {
    if (!validateRawQuestion(item)) {
      invalid += 1;
      continue;
    }

    valid.push({
      id: crypto.randomUUID(),
      subject: config.subject,
      topic: config.topic,
      difficulty: config.difficulty,
      type: item.type,
      question: item.question,
      options: item.type === 'choice' ? item.options : undefined,
      answer: item.answer,
      explanation: item.explanation,
      generatedAt,
    });
  }

  return { valid, invalid };
}
