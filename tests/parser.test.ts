import { describe, it, expect } from 'vitest';
import { extractJson, validateQuestions, ParserError } from '../src/services/parser';
import type { QuestionGenerationConfig } from '../src/types';

const baseConfig: QuestionGenerationConfig = {
  subject: 'math',
  topic: 'fraction-addition',
  difficulty: 2,
  count: 2,
  grade: 4,
};

describe('extractJson', () => {
  it('parses a raw JSON array string', () => {
    const raw = JSON.stringify([{ type: 'choice', question: '1+1=?', answer: 0 }]);
    expect(extractJson(raw)).toEqual([{ type: 'choice', question: '1+1=?', answer: 0 }]);
  });

  it('extracts JSON from markdown code fences', () => {
    const raw = `Here are the questions:

\`\`\`json
[
  { "type": "fillblank", "question": "2+2=____", "answer": "4", "explanation": "basic addition" }
]
\`\`\`

Hope this helps!`;
    const result = extractJson(raw);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('extracts JSON from code fences without language tag', () => {
    const inner = JSON.stringify([{ a: 1 }]);
    const raw = `Some text\n\`\`\`\n${inner}\n\`\`\``;
    expect(extractJson(raw)).toEqual([{ a: 1 }]);
  });

  it('throws ParserError for malformed JSON', () => {
    expect(() => extractJson('not json at all')).toThrow(ParserError);
    expect(() => extractJson('{ incomplete')).toThrow(ParserError);
  });

  it('throws ParserError for empty input', () => {
    expect(() => extractJson('')).toThrow(ParserError);
    expect(() => extractJson('   ')).toThrow(ParserError);
  });
});

describe('validateQuestions', () => {
  it('returns valid questions enriched with config metadata', () => {
    const raw = [
      {
        type: 'choice',
        question: '1/2 + 1/4 = ?',
        options: ['1/6', '2/6', '3/4', '1'],
        answer: 2,
        explanation: '通分后相加',
      },
      {
        type: 'fillblank',
        question: '3 x 4 = ____',
        answer: '12',
        explanation: '乘法口诀',
      },
    ];

    const { valid, invalid } = validateQuestions(raw, baseConfig);
    expect(valid).toHaveLength(2);
    expect(invalid).toBe(0);

    const [choice, fillblank] = valid;
    expect(choice.id).toEqual(expect.any(String));
    expect(choice.subject).toBe('math');
    expect(choice.topic).toBe('fraction-addition');
    expect(choice.difficulty).toBe(2);
    expect(choice.options).toEqual(['1/6', '2/6', '3/4', '1']);
    expect(choice.answer).toBe(2);
    expect(choice.generatedAt).toBeGreaterThan(0);

    expect(fillblank.type).toBe('fillblank');
    expect(fillblank.answer).toBe('12');
    expect(fillblank.options).toBeUndefined();
  });

  it('accepts JSON extracted from markdown fences', () => {
    const rawText = `\`\`\`json
[
  {
    "type": "choice",
    "question": "Select 2",
    "options": ["1", "2", "3", "4"],
    "answer": 1,
    "explanation": "two"
  }
]
\`\`\``;
    const parsed = extractJson(rawText);
    const { valid, invalid } = validateQuestions(parsed, baseConfig);
    expect(valid).toHaveLength(1);
    expect(invalid).toBe(0);
  });

  it('rejects items with missing or empty required fields', () => {
    const raw = [
      {
        type: 'choice',
        question: 'missing explanation',
        options: ['a', 'b', 'c', 'd'],
        answer: 0,
      },
      {
        type: 'choice',
        question: '',
        options: ['a', 'b', 'c', 'd'],
        answer: 0,
        explanation: 'empty question',
      },
      {
        type: 'fillblank',
        question: 'missing answer',
        explanation: 'no answer field',
      },
      {
        type: 'spelling',
        question: 'empty answer',
        answer: '',
        explanation: 'answer is empty string',
      },
    ];

    const { valid, invalid } = validateQuestions(raw, baseConfig);
    expect(valid).toHaveLength(0);
    expect(invalid).toBe(4);
  });

  it('rejects choice questions with invalid answer indices', () => {
    const raw = [
      {
        type: 'choice',
        question: 'negative index',
        options: ['a', 'b', 'c', 'd'],
        answer: -1,
        explanation: 'invalid',
      },
      {
        type: 'choice',
        question: 'out of range',
        options: ['a', 'b', 'c', 'd'],
        answer: 4,
        explanation: 'invalid',
      },
      {
        type: 'choice',
        question: 'non integer',
        options: ['a', 'b', 'c', 'd'],
        answer: 1.5,
        explanation: 'invalid',
      },
    ];

    const { valid, invalid } = validateQuestions(raw, baseConfig);
    expect(valid).toHaveLength(0);
    expect(invalid).toBe(3);
  });

  it('rejects choice questions without exactly four options', () => {
    const raw = [
      {
        type: 'choice',
        question: 'too few',
        options: ['a', 'b'],
        answer: 0,
        explanation: 'invalid',
      },
      {
        type: 'choice',
        question: 'too many',
        options: ['a', 'b', 'c', 'd', 'e'],
        answer: 0,
        explanation: 'invalid',
      },
      {
        type: 'choice',
        question: 'non string option',
        options: ['a', 'b', 'c', 4],
        answer: 0,
        explanation: 'invalid',
      },
    ];

    const { valid, invalid } = validateQuestions(raw, baseConfig);
    expect(valid).toHaveLength(0);
    expect(invalid).toBe(3);
  });

  it('returns an empty result with an error when input is not an array', () => {
    const result = validateQuestions({ not: 'an array' }, baseConfig);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toBe(0);
    expect(result.error).toBe('Expected a JSON array of questions');
  });

  it('returns an empty result with an error for an invalid generation config', () => {
    const invalidConfig = { ...baseConfig, subject: 'physics' } as unknown as QuestionGenerationConfig;
    const result = validateQuestions([], invalidConfig);
    expect(result.valid).toHaveLength(0);
    expect(result.error).toBe('Invalid generation config');
  });
});
