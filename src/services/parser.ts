import type { Difficulty, Question, QuestionGenerationConfig, QuestionType, Subject } from '../types';

const QUESTION_TYPES: QuestionType[] = ['choice', 'fillblank', 'spelling'];
const SUBJECTS: Subject[] = ['chinese', 'math', 'english'];
const DIFFICULTIES: Difficulty[] = [1, 2, 3];

function generateQuestionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class ParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParserError';
  }
}

function parseJsonText(jsonText: string): unknown {
  try {
    return JSON.parse(jsonText);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown JSON parse error';
    throw new ParserError(`Invalid JSON: ${message}`);
  }
}

function findFirstJson(text: string): string | null {
  const startMatch = text.search(/[\[{]/);
  if (startMatch === -1) {
    return null;
  }

  const open = text[startMatch];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startMatch; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === open) {
      depth += 1;
    } else if (ch === close) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startMatch, i + 1);
      }
    }
  }

  return null;
}

function extractFencedJson(text: string): string | undefined {
  const fenceRegex = /```([a-z]*)\s*([\s\S]*?)\s*```/gi;
  let firstJsonLike: string | undefined;

  let match;
  while ((match = fenceRegex.exec(text)) !== null) {
    const language = match[1].toLowerCase();
    const content = match[2].trim();

    if (language === 'json') {
      return content;
    }

    if (firstJsonLike === undefined && /^[\[{]/.test(content)) {
      firstJsonLike = content;
    }
  }

  return firstJsonLike;
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new ParserError('Empty response');
  }

  const fencedJson = extractFencedJson(trimmed);
  if (fencedJson !== undefined) {
    return parseJsonText(fencedJson);
  }

  const stripped = trimmed.replace(/```[\s\S]*?```/g, '');
  const firstJson = findFirstJson(stripped);
  if (firstJson === null) {
    throw new ParserError('No JSON array or object found');
  }

  return parseJsonText(firstJson);
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
      id: generateQuestionId(),
      subject: config.subject,
      topic: config.topic,
      difficulty: config.difficulty,
      type: item.type,
      question: item.question.trim(),
      options: item.type === 'choice' ? (item.options as string[]).map((opt) => opt.trim()) : undefined,
      answer: item.type === 'choice' ? item.answer : (item.answer as string).trim(),
      explanation: item.explanation.trim(),
      generatedAt,
    });
  }

  return { valid, invalid };
}
