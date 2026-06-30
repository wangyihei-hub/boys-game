import type { V3Level, V3Question, V3BossPart, V3Subject } from '../data/v3/types';
import { assertV3Level, BOSS_PARTS_COUNT, QUESTIONS_PER_BATTLE } from '../data/v3';
import type { Question } from '../types';

function prefix(subject: V3Subject): string {
  if (subject === 'chinese') return 'c';
  if (subject === 'math') return 'm';
  return 'e';
}

function toQuestion(
  subject: V3Subject,
  _levelNumber: number,
  source: V3Question | V3BossPart,
  id: string,
  difficulty: 1 | 2 | 3,
  topic: string
): Question {
  return {
    id,
    subject,
    topic,
    difficulty,
    type: source.type,
    question: source.question,
    options: source.options,
    answer: source.answer,
    explanation: source.explanation ?? '',
    generatedAt: 0
  };
}

export function buildBattleQuestions(subject: V3Subject, levelNumber: number): Question[] {
  const level = assertV3Level(subject, levelNumber);
  const pre = prefix(subject);
  const difficulty = level.difficulty;

  const normal = [...level.questions];
  const shuffled = normal.sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, QUESTIONS_PER_BATTLE);

  const questions: Question[] = picked.map((q, index) => {
    const id = `${pre}-L${String(levelNumber).padStart(3, '0')}-Q${String(index + 1).padStart(2, '0')}`;
    return toQuestion(subject, levelNumber, q, id, difficulty, level.topic);
  });

  for (let i = 1; i <= BOSS_PARTS_COUNT; i++) {
    const part = level.boss.parts[i - 1];
    if (!part) continue;
    const id = `${pre}-L${String(levelNumber).padStart(3, '0')}-BOSS-${i}`;
    questions.push(toQuestion(subject, levelNumber, part, id, difficulty, level.topic));
  }

  return questions;
}

export function getLevelName(level: V3Level): string {
  return level.topic;
}
