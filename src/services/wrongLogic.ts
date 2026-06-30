import { getV3Level } from '../data/v3';
import type { V3BossPart, V3Question, V3Subject } from '../data/v3/types';
import { deleteWrongQuestion, getWrongQuestion, getWrongQuestions, saveWrongQuestion } from '../db/dataAccess';
import type { WrongQuestion } from '../types';

const ID_PATTERN = /^([cme])-L(\d{3})-(Q\d{2}|BOSS-(\d))$/;

const SUBJECT_BY_PREFIX: Record<string, V3Subject> = {
  c: 'chinese',
  m: 'math',
  e: 'english'
};

export interface WrongQuestionDisplay {
  record: WrongQuestion;
  subject: V3Subject;
  levelNumber: number;
  isBoss: boolean;
  questionText: string;
  answer: number | string;
  explanation?: string;
  options?: string[];
}

export function parseV3QuestionId(questionId: string): {
  subject: V3Subject;
  levelNumber: number;
  isBoss: boolean;
  index: number;
} | null {
  const match = questionId.match(ID_PATTERN);
  if (!match) return null;
  const subject = SUBJECT_BY_PREFIX[match[1]];
  const levelNumber = parseInt(match[2], 10);
  const isBoss = match[3].startsWith('BOSS');
  const index = isBoss ? parseInt(match[4], 10) : parseInt(match[3].slice(1), 10) - 1;
  return { subject, levelNumber, isBoss, index };
}

export function findV3QuestionById(questionId: string): {
  subject: V3Subject;
  levelNumber: number;
  question: V3Question | V3BossPart;
  isBoss: boolean;
} | null {
  const parsed = parseV3QuestionId(questionId);
  if (!parsed) return null;
  const level = getV3Level(parsed.subject, parsed.levelNumber);
  if (!level) return null;

  if (parsed.isBoss) {
    const part = level.boss.parts[parsed.index - 1];
    if (!part) return null;
    return { subject: parsed.subject, levelNumber: parsed.levelNumber, question: part, isBoss: true };
  }

  const question = level.questions[parsed.index];
  if (!question) return null;
  return { subject: parsed.subject, levelNumber: parsed.levelNumber, question, isBoss: false };
}

export async function recordWrongAnswer(questionId: string): Promise<void> {
  const existing = await getWrongQuestion(questionId);
  await saveWrongQuestion({
    questionId,
    wrongCount: (existing?.wrongCount ?? 0) + 1,
    lastReviewAt: Date.now()
  });
}

export async function decrementWrongCount(questionId: string): Promise<void> {
  const existing = await getWrongQuestion(questionId);
  if (!existing) return;
  const nextCount = existing.wrongCount - 1;
  if (nextCount <= 0) {
    await deleteWrongQuestion(questionId);
  } else {
    await saveWrongQuestion({ ...existing, wrongCount: nextCount, lastReviewAt: Date.now() });
  }
}

export async function getWrongQuestionDisplays(): Promise<WrongQuestionDisplay[]> {
  const records = await getWrongQuestions();
  const result: WrongQuestionDisplay[] = [];
  for (const record of records) {
    const found = findV3QuestionById(record.questionId);
    if (!found) continue;
    result.push({
      record,
      subject: found.subject,
      levelNumber: found.levelNumber,
      isBoss: found.isBoss,
      questionText: found.question.question,
      answer: found.question.answer,
      explanation: found.question.explanation,
      options: found.question.options
    });
  }
  return result.sort((a, b) => b.record.wrongCount - a.record.wrongCount);
}

export function groupWrongDisplaysBySubject(displays: WrongQuestionDisplay[]): Record<V3Subject, WrongQuestionDisplay[]> {
  const grouped: Record<V3Subject, WrongQuestionDisplay[]> = {
    chinese: [],
    math: [],
    english: []
  };
  for (const display of displays) {
    grouped[display.subject].push(display);
  }
  return grouped;
}
