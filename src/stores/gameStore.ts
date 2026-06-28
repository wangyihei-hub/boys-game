import { create } from 'zustand';
import type {
  BattleAnswer,
  BattleRecord,
  BattleResult,
  Progress,
  Question,
  Stage,
  Subject
} from '../types';
import {
  BattleState,
  calculateLevelUp,
  calculateRewards,
  createBattleState,
  escapeBattle,
  submitAnswer,
  submitTimeout
} from '../services/battleLogic';
import type { EquipmentBonuses } from '../services/equipmentLogic';
import type { PetSkillEffect } from '../services/petLogic';
import {
  getDailyTasks,
  getProgress,
  getWrongQuestion,
  saveBattleRecord,
  saveDailyTasks,
  saveProgressBatch,
  saveWrongQuestion
} from '../db/dataAccess';
import { generateDailyTasks, getTodayKey, updateTaskProgress } from '../services/dailyTaskLogic';
import { useProfileStore } from './profileStore';

export const STAGES: Stage[] = [
  // 语文之森 — 9 stages
  { id: 'c1', subject: 'chinese', regionName: '语文之森', stageNumber: 1, name: '字词小径', difficulty: 1, questionCount: 4, monsterHp: 30, isBoss: false },
  { id: 'c2', subject: 'chinese', regionName: '语文之森', stageNumber: 2, name: '成语小溪', difficulty: 1, questionCount: 4, monsterHp: 40, isBoss: false },
  { id: 'c3', subject: 'chinese', regionName: '语文之森', stageNumber: 3, name: '句子山谷', difficulty: 1, questionCount: 5, monsterHp: 50, isBoss: false },
  { id: 'c4', subject: 'chinese', regionName: '语文之森', stageNumber: 4, name: '古诗山丘', difficulty: 2, questionCount: 5, monsterHp: 60, isBoss: false },
  { id: 'c5', subject: 'chinese', regionName: '语文之森', stageNumber: 5, name: '阅读森林', difficulty: 2, questionCount: 6, monsterHp: 75, isBoss: false },
  { id: 'c6', subject: 'chinese', regionName: '语文之森', stageNumber: 6, name: '写作营地', difficulty: 2, questionCount: 6, monsterHp: 90, isBoss: false },
  { id: 'c7', subject: 'chinese', regionName: '语文之森', stageNumber: 7, name: '文言古道', difficulty: 3, questionCount: 7, monsterHp: 110, isBoss: false },
  { id: 'c8', subject: 'chinese', regionName: '语文之森', stageNumber: 8, name: '综合高地', difficulty: 3, questionCount: 7, monsterHp: 130, isBoss: false },
  { id: 'c9', subject: 'chinese', regionName: '语文之森', stageNumber: 9, name: '语文巨兽', difficulty: 3, questionCount: 7, monsterHp: 220, isBoss: true },

  // 数学迷宫 — 9 stages
  { id: 'm1', subject: 'math', regionName: '数学迷宫', stageNumber: 1, name: '加法入口', difficulty: 1, questionCount: 4, monsterHp: 30, isBoss: false },
  { id: 'm2', subject: 'math', regionName: '数学迷宫', stageNumber: 2, name: '减法走廊', difficulty: 1, questionCount: 4, monsterHp: 40, isBoss: false },
  { id: 'm3', subject: 'math', regionName: '数学迷宫', stageNumber: 3, name: '乘法房间', difficulty: 1, questionCount: 5, monsterHp: 50, isBoss: false },
  { id: 'm4', subject: 'math', regionName: '数学迷宫', stageNumber: 4, name: '除法厅堂', difficulty: 2, questionCount: 5, monsterHp: 60, isBoss: false },
  { id: 'm5', subject: 'math', regionName: '数学迷宫', stageNumber: 5, name: '方程回廊', difficulty: 2, questionCount: 6, monsterHp: 75, isBoss: false },
  { id: 'm6', subject: 'math', regionName: '数学迷宫', stageNumber: 6, name: '图形密室', difficulty: 2, questionCount: 6, monsterHp: 90, isBoss: false },
  { id: 'm7', subject: 'math', regionName: '数学迷宫', stageNumber: 7, name: '统计塔楼', difficulty: 3, questionCount: 7, monsterHp: 110, isBoss: false },
  { id: 'm8', subject: 'math', regionName: '数学迷宫', stageNumber: 8, name: '综合广场', difficulty: 3, questionCount: 7, monsterHp: 130, isBoss: false },
  { id: 'm9', subject: 'math', regionName: '数学迷宫', stageNumber: 9, name: '数学魔王', difficulty: 3, questionCount: 7, monsterHp: 220, isBoss: true },

  // 英语海岸 — 9 stages
  { id: 'e1', subject: 'english', regionName: '英语海岸', stageNumber: 1, name: '单词沙滩', difficulty: 1, questionCount: 4, monsterHp: 30, isBoss: false },
  { id: 'e2', subject: 'english', regionName: '英语海岸', stageNumber: 2, name: '句型浅湾', difficulty: 1, questionCount: 4, monsterHp: 40, isBoss: false },
  { id: 'e3', subject: 'english', regionName: '英语海岸', stageNumber: 3, name: '对话港口', difficulty: 1, questionCount: 5, monsterHp: 50, isBoss: false },
  { id: 'e4', subject: 'english', regionName: '英语海岸', stageNumber: 4, name: '语法礁石', difficulty: 2, questionCount: 5, monsterHp: 60, isBoss: false },
  { id: 'e5', subject: 'english', regionName: '英语海岸', stageNumber: 5, name: '阅读海域', difficulty: 2, questionCount: 6, monsterHp: 75, isBoss: false },
  { id: 'e6', subject: 'english', regionName: '英语海岸', stageNumber: 6, name: '写作海湾', difficulty: 2, questionCount: 6, monsterHp: 90, isBoss: false },
  { id: 'e7', subject: 'english', regionName: '英语海岸', stageNumber: 7, name: '完形暗礁', difficulty: 3, questionCount: 7, monsterHp: 110, isBoss: false },
  { id: 'e8', subject: 'english', regionName: '英语海岸', stageNumber: 8, name: '综合灯塔', difficulty: 3, questionCount: 7, monsterHp: 130, isBoss: false },
  { id: 'e9', subject: 'english', regionName: '英语海岸', stageNumber: 9, name: '英语海怪', difficulty: 3, questionCount: 7, monsterHp: 220, isBoss: true }
];

export function getStageById(stageId: string): Stage | undefined {
  return STAGES.find(s => s.id === stageId);
}

export function getStagesBySubject(subject: Subject): Stage[] {
  return STAGES.filter(s => s.subject === subject);
}

export function getDefaultProgress(): Progress[] {
  return STAGES.map(stage => ({
    id: `${stage.subject}-${stage.id}`,
    subject: stage.subject,
    stageId: stage.id,
    status: stage.stageNumber === 1 ? 'unlocked' : 'locked',
    stars: 0,
    bestScore: 0
  }));
}

export function computeRegionProgress(progressList: Progress[], subject: Subject): {
  passed: number;
  total: number;
} {
  const subjectProgress = progressList.filter(p => p.subject === subject);
  const passed = subjectProgress.filter(p => p.status === 'passed').length;
  return { passed, total: subjectProgress.length };
}

interface GameState {
  progress: Progress[];
  loaded: boolean;
  error: string | null;
  currentBattle: BattleState | null;
  lastBattleRecord: BattleRecord | null;
  loadProgress: () => Promise<void>;
  startBattle: (stage: Stage, questions: Question[], playerLevel: number, bonuses?: Partial<EquipmentBonuses>) => void;
  submitAnswer: (selectedAnswer: string | number, playerLevel: number, bonuses?: Partial<EquipmentBonuses>, petEffect?: PetSkillEffect) => void;
  submitTimeout: (bonuses?: Partial<EquipmentBonuses>) => void;
  escapeBattle: () => void;
  finishBattle: (playerLevel: number, currentExp: number, petEffect?: PetSkillEffect) => Promise<{
    result: BattleResult;
    stars: number;
    exp: number;
    levelUps: number;
    newLevel: number;
    newExp: number;
    doubled: boolean;
  }>;
  clearCurrentBattle: () => void;
  clearError: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  progress: [],
  loaded: false,
  error: null,
  currentBattle: null,
  lastBattleRecord: null,

  async loadProgress() {
    try {
      const firstStage = STAGES[0];
      const sample = await getProgress(`${firstStage.subject}-${firstStage.id}`);
      let progress: Progress[];
      if (!sample) {
        progress = getDefaultProgress();
        await saveProgressBatch(progress);
      } else {
        const stored = await Promise.all(
          STAGES.map(stage => getProgress(`${stage.subject}-${stage.id}`))
        );
        progress = stored.map((p, index) => p ?? getDefaultProgress()[index]);
      }
      set({ progress, loaded: true, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载进度失败', loaded: true });
    }
  },

  startBattle(stage, questions, playerLevel, bonuses = {}) {
    set({ currentBattle: createBattleState(stage, questions, playerLevel, bonuses), lastBattleRecord: null });
  },

  submitAnswer(selectedAnswer, playerLevel, bonuses = {}, petEffect) {
    const battle = get().currentBattle;
    if (!battle) return;
    set({ currentBattle: submitAnswer(battle, selectedAnswer, playerLevel, bonuses, petEffect) });
  },

  submitTimeout(bonuses = {}) {
    const battle = get().currentBattle;
    if (!battle) return;
    set({ currentBattle: submitTimeout(battle, bonuses) });
  },

  escapeBattle() {
    const battle = get().currentBattle;
    if (!battle) return;
    set({ currentBattle: escapeBattle(battle) });
  },

  async finishBattle(playerLevel, currentExp, petEffect) {
    const battle = get().currentBattle;
    if (!battle) {
      throw new Error('当前没有战斗');
    }
    if (!battle.finished) {
      throw new Error('战斗尚未结束');
    }

    const { stars, exp, doubled } = calculateRewards(battle, petEffect);
    const { newLevel, newExp, levelUps } = calculateLevelUp(playerLevel, currentExp, exp);

    const durationMs = Math.round(performance.now() - battle.startTime);
    const minutes = Math.max(1, Math.ceil(durationMs / 60000));
    await useProfileStore.getState().recordMinutesPlayed(minutes);

    const correctAnswers = battle.answers.filter(a => a.correct).length;

    const record: BattleRecord = {
      id: `${battle.stage.subject}-${battle.stage.id}-${Date.now()}`,
      subject: battle.stage.subject,
      stageId: battle.stage.id,
      result: battle.result ?? 'escape',
      durationMs,
      starsEarned: stars,
      expEarned: exp,
      correctAnswers,
      createdAt: Date.now()
    };

    await saveBattleRecord(record);

    // Persist wrong answers
    for (const answer of battle.answers) {
      if (answer.correct) continue;
      const questionId = battle.questions[battle.answers.indexOf(answer)]?.id ?? '';
      if (!questionId) continue;
      const existing = await getWrongQuestion(questionId);
      await saveWrongQuestion({
        questionId,
        wrongCount: (existing?.wrongCount ?? 0) + 1,
        lastReviewAt: Date.now()
      });
    }

    // Update daily tasks
    const today = getTodayKey();
    let tasks = await getDailyTasks(today);
    if (tasks.length === 0) {
      tasks = generateDailyTasks(today);
    }
    const correctCount = battle.answers.filter((a: BattleAnswer) => a.correct).length;
    const taskUpdates: { type: 'win_battle' | 'correct_answers'; increment: number }[] = [
      { type: 'win_battle', increment: battle.result === 'win' ? 1 : 0 },
      { type: 'correct_answers', increment: correctCount }
    ];
    let updatedTasks = tasks;
    for (const update of taskUpdates) {
      const { next } = updateTaskProgress(updatedTasks, update.type, update.increment);
      updatedTasks = next;
    }
    await saveDailyTasks(updatedTasks);

    const progressList = get().progress;
    const progressIndex = progressList.findIndex(
      p => p.subject === battle.stage.subject && p.stageId === battle.stage.id
    );

    if (progressIndex !== -1) {
      const currentProgress = progressList[progressIndex];
      const correctCount = battle.answers.filter((a: BattleAnswer) => a.correct).length;
      const score = battle.result === 'win'
        ? Math.round((correctCount / battle.questions.length) * 100)
        : currentProgress.bestScore;

      const nextProgress: Progress = {
        ...currentProgress,
        status: battle.result === 'win' ? 'passed' : currentProgress.status,
        stars: battle.result === 'win' ? Math.max(currentProgress.stars, stars) : currentProgress.stars,
        bestScore: Math.max(currentProgress.bestScore, score)
      };

      const nextList = [...progressList];
      nextList[progressIndex] = nextProgress;

      // 解锁下一关
      if (battle.result === 'win') {
        const subjectStages = getStagesBySubject(battle.stage.subject);
        const currentStageIndex = subjectStages.findIndex(s => s.id === battle.stage.id);
        const nextStage = subjectStages[currentStageIndex + 1];
        if (nextStage) {
          const nextProgressIndex = nextList.findIndex(
            p => p.subject === nextStage.subject && p.stageId === nextStage.id
          );
          if (nextProgressIndex !== -1 && nextList[nextProgressIndex].status === 'locked') {
            nextList[nextProgressIndex] = {
              ...nextList[nextProgressIndex],
              status: 'unlocked'
            };
          }
        }
      }

      await saveProgressBatch(nextList);
      set({ progress: nextList, lastBattleRecord: record });
    } else {
      set({ lastBattleRecord: record });
    }

    return {
      result: battle.result ?? 'escape',
      stars,
      exp,
      levelUps,
      newLevel,
      newExp,
      doubled
    };
  },

  clearCurrentBattle() {
    set({ currentBattle: null });
  },

  clearError() {
    set({ error: null });
  }
}));
