import type { CurriculumConfig, CurriculumDay, CurriculumLesson, Difficulty, Subject } from '../types';

export const CURRICULUM_DAYS = 60;
export const CURRICULUM_WEEKS = 9;

// Weekly topic pools by subject and grade.
// 60-day plan = 9 weeks; each week has one theme per active subject.
const GRADE_TOPICS: Record<4 | 5, Record<Subject, string[]>> = {
  4: {
    math: [
      '大数的认识', '三位数乘两位数', '除数是两位数的除法', '四则运算综合',
      '运算定律', '小数的意义与加减', '三角形与观察物体', '小数的乘除法',
      '综合复习'
    ],
    chinese: [
      '词语与成语', '句子改写与修辞', '段落概括', '古诗词默写与理解',
      '阅读理解之人物', '阅读理解之中心思想', '作文开头与结构', '修改病句',
      '综合复习'
    ],
    english: [
      '名词与单复数', '一般现在时', '现在进行时', '一般过去时',
      '形容词比较级', '方位介词与日常对话', '阅读理解选择', '词汇拼写与短语',
      '综合复习'
    ]
  },
  5: {
    math: [
      '小数乘法', '小数除法', '简易方程', '多边形的面积',
      '统计与概率', '因数与倍数', '长方体和正方体', '分数的意义与加减',
      '综合复习'
    ],
    chinese: [
      '字词辨析', '成语故事', '句式训练', '修辞与表达',
      '古诗词赏析', '文言文初识', '记叙文与说明文阅读', '作文立意与素材',
      '综合复习'
    ],
    english: [
      '一般将来时', '情态动词', '形容词最高级', '过去进行时',
      'there be 句型', '阅读判断', '完形填空', '写作句子与词汇辨析',
      '综合复习'
    ]
  }
};

function getWeekDifficulty(weekIndex: number): Difficulty {
  if (weekIndex < 3) return 1;
  if (weekIndex < 6) return 2;
  return 3;
}

function getDateKeyAfterDays(startDate: string, dayIndex: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayIndex);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getTodayKey(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function generateCurriculumPlan(config: CurriculumConfig): CurriculumDay[] {
  const { grade, startDate, subjects, questionsPerLesson } = config;
  const topics = GRADE_TOPICS[grade];
  const plan: CurriculumDay[] = [];

  for (let dayIndex = 0; dayIndex < CURRICULUM_DAYS; dayIndex += 1) {
    const weekIndex = Math.floor(dayIndex / 7);
    const lessonIndex = dayIndex % 7; // 0-6, but we only use 0-2 for subjects rotation
    const difficulty = getWeekDifficulty(weekIndex);

    const lessons: CurriculumLesson[] = subjects.map((subject, subjectIndex) => {
      const subjectTopics = topics[subject];
      // Rotate through topics so each week has a fresh theme while maintaining subject order.
      const topicIndex = (weekIndex + subjectIndex + lessonIndex) % subjectTopics.length;
      return {
        subject,
        topic: subjectTopics[topicIndex],
        difficulty,
        questionCount: questionsPerLesson,
      };
    });

    plan.push({
      dayIndex,
      dateKey: getDateKeyAfterDays(startDate, dayIndex),
      lessons,
    });
  }

  return plan;
}

export function getCurriculumDay(config: CurriculumConfig | undefined, dayIndex: number): CurriculumDay | undefined {
  if (!config || !config.enabled) return undefined;
  const plan = generateCurriculumPlan(config);
  return plan[dayIndex];
}

export function getTodayCurriculumDay(config: CurriculumConfig | undefined): CurriculumDay | undefined {
  if (!config || !config.enabled || !config.startDate) return undefined;
  const start = new Date(config.startDate).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const diffMs = today - start;
  const dayIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (dayIndex < 0 || dayIndex >= CURRICULUM_DAYS) return undefined;
  return getCurriculumDay(config, dayIndex);
}

export function getCurriculumStatus(config: CurriculumConfig | undefined): {
  dayIndex: number | null;
  totalDays: number;
  inRange: boolean;
} {
  if (!config || !config.enabled || !config.startDate) {
    return { dayIndex: null, totalDays: CURRICULUM_DAYS, inRange: false };
  }
  const start = new Date(config.startDate).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const dayIndex = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return {
    dayIndex,
    totalDays: CURRICULUM_DAYS,
    inRange: dayIndex >= 0 && dayIndex < CURRICULUM_DAYS,
  };
}

export { getTodayKey };
