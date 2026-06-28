import type { CurriculumConfig, CurriculumDay, CurriculumLesson, GenerationResult, Question, QuestionGenerationConfig } from '../types';
import { generateCurriculumPlan, getTodayCurriculumDay, CURRICULUM_DAYS } from './curriculumData';
import { generateLocalQuestions } from './localQuestionGenerator';
import { validateQuestions } from './parser';
import { getTodayKey } from './dailyTaskLogic';

export type LessonGenerationConfig = Pick<QuestionGenerationConfig, 'subject' | 'topic' | 'difficulty' | 'count' | 'grade'>;

export function buildLessonGenerationConfig(
  lesson: CurriculumLesson,
  grade: 4 | 5
): LessonGenerationConfig {
  return {
    subject: lesson.subject,
    topic: lesson.topic,
    difficulty: lesson.difficulty,
    count: lesson.questionCount,
    grade,
  };
}

export async function generateLessonQuestions(
  lesson: CurriculumLesson,
  grade: 4 | 5
): Promise<Question[]> {
  const config = buildLessonGenerationConfig(lesson, grade);
  const rawQuestions = await generateLocalQuestions(config);
  const { valid, error } = validateQuestions(rawQuestions, config);
  if (error) {
    throw new Error(error);
  }
  // Stamp generatedAt and subject/topic on each question.
  const now = Date.now();
  return valid.map((q, i) => ({
    ...q,
    id: `${lesson.subject}-${lesson.topic}-${now}-${i}`,
    subject: lesson.subject,
    topic: lesson.topic,
    difficulty: lesson.difficulty,
    generatedAt: now,
  }));
}

export async function generateDayQuestions(
  day: CurriculumDay,
  grade: 4 | 5,
  onProgress?: (subject: string, count: number) => void
): Promise<Question[]> {
  const all: Question[] = [];
  for (const lesson of day.lessons) {
    const questions = await generateLessonQuestions(lesson, grade);
    if (onProgress) onProgress(lesson.subject, questions.length);
    all.push(...questions);
  }
  return all;
}

export async function generateCurriculumQuestionsForRange(
  config: CurriculumConfig,
  startDayIndex = 0,
  endDayIndex = CURRICULUM_DAYS - 1,
  onProgress?: (dayIndex: number, subject: string, count: number) => void
): Promise<{ questions: Question[]; generatedCount: number; failed: number }> {
  const plan = generateCurriculumPlan(config);
  const all: Question[] = [];
  let generatedCount = 0;
  let failed = 0;

  const safeStart = Math.max(0, startDayIndex);
  const safeEnd = Math.min(CURRICULUM_DAYS - 1, endDayIndex);

  for (let i = safeStart; i <= safeEnd; i += 1) {
    const day = plan[i];
    for (const lesson of day.lessons) {
      try {
        const questions = await generateLessonQuestions(lesson, config.grade);
        if (onProgress) onProgress(i, lesson.subject, questions.length);
        all.push(...questions);
        generatedCount += questions.length;
      } catch {
        failed += 1;
      }
    }
  }

  return { questions: all, generatedCount, failed };
}

export function getTodayLessons(config: CurriculumConfig | undefined): CurriculumLesson[] {
  const day = getTodayCurriculumDay(config);
  return day?.lessons ?? [];
}

export function getTodayDateKey(): string {
  return getTodayKey();
}

export function buildCurriculumResult(
  generatedCount: number,
  failed: number,
  questions: Question[],
  durationMs: number
): GenerationResult {
  return {
    success: generatedCount,
    failed,
    questions,
    durationMs,
  };
}
