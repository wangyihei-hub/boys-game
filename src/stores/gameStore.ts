import { create } from 'zustand';
import type {
  BattleRecord,
  BattleResult,
  Progress,
  Question,
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
  saveBattleRecord,
  saveDailyTasks,
  saveProgressBatch
} from '../db/dataAccess';
import { generateDailyTasks, getTodayKey, updateTaskProgress } from '../services/dailyTaskLogic';
import { recordWrongAnswer } from '../services/wrongLogic';
import { useProfileStore } from './profileStore';
import { assertV3Level, LEVEL_COUNT } from '../data/v3';
import { advanceCurrentLevel, markDailyPass } from '../services/staminaLogic';

export function getProgressId(subject: Subject, levelNumber: number): string {
  return `${subject}-${String(levelNumber).padStart(3, '0')}`;
}

export function getDefaultProgress(): Progress[] {
  const progress: Progress[] = [];
  for (let levelNumber = 1; levelNumber <= LEVEL_COUNT; levelNumber++) {
    for (const subject of (['chinese', 'math', 'english'] as Subject[])) {
      progress.push({
        id: getProgressId(subject, levelNumber),
        subject,
        levelNumber,
        status: levelNumber === 1 ? 'unlocked' : 'locked'
      });
    }
  }
  return progress;
}

export function computeSubjectProgress(progressList: Progress[], subject: Subject): {
  passed: number;
  total: number;
} {
  const subjectProgress = progressList.filter(p => p.subject === subject);
  const passed = subjectProgress.filter(p => p.status === 'passed').length;
  return { passed, total: subjectProgress.length };
}

export function computeCurrentLevel(progressList: Progress[]): number {
  let level = 1;
  while (level <= LEVEL_COUNT) {
    const trio = (['chinese', 'math', 'english'] as Subject[]).map(s =>
      progressList.find(p => p.subject === s && p.levelNumber === level)
    );
    if (trio.every(p => p?.status === 'passed')) {
      level++;
    } else {
      break;
    }
  }
  return level;
}

export function isLevelUnlocked(progressList: Progress[], levelNumber: number): boolean {
  if (levelNumber === 1) return true;
  const prev = levelNumber - 1;
  return (['chinese', 'math', 'english'] as Subject[]).every(subject => {
    const p = progressList.find(p => p.subject === subject && p.levelNumber === prev);
    return p?.status === 'passed';
  });
}

interface GameState {
  progress: Progress[];
  loaded: boolean;
  error: string | null;
  currentBattle: BattleState | null;
  lastBattleRecord: BattleRecord | null;
  loadProgress: () => Promise<void>;
  startBattle: (subject: Subject, levelNumber: number, questions: Question[]) => void;
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
      const sample = await getProgress(getProgressId('chinese', 1));
      let progress: Progress[];
      if (!sample) {
        progress = getDefaultProgress();
        await saveProgressBatch(progress);
      } else {
        const stored = await Promise.all(
          Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).flatMap(levelNumber =>
            (['chinese', 'math', 'english'] as Subject[]).map(subject =>
              getProgress(getProgressId(subject, levelNumber))
            )
          )
        );
        const defaults = getDefaultProgress();
        progress = stored.map((p, index) => p ?? defaults[index]);
      }
      set({ progress, loaded: true, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载进度失败', loaded: true });
    }
  },

  startBattle(subject, levelNumber, questions) {
    const level = assertV3Level(subject, levelNumber);
    set({
      currentBattle: createBattleState(subject, levelNumber, level.topic, level.difficulty, questions),
      lastBattleRecord: null
    });
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
      id: `${battle.subject}-L${String(battle.levelNumber).padStart(3, '0')}-${Date.now()}`,
      subject: battle.subject,
      levelNumber: battle.levelNumber,
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
      await recordWrongAnswer(answer.questionId);
    }

    // Update daily tasks
    const today = getTodayKey();
    let tasks = await getDailyTasks(today);
    if (tasks.length === 0) {
      tasks = generateDailyTasks(today);
    }
    const taskUpdates: { type: 'win_battle' | 'correct_answers'; increment: number }[] = [
      { type: 'win_battle', increment: battle.result === 'win' ? 1 : 0 },
      { type: 'correct_answers', increment: correctAnswers }
    ];
    let updatedTasks = tasks;
    for (const update of taskUpdates) {
      const { next } = updateTaskProgress(updatedTasks, update.type, update.increment);
      updatedTasks = next;
    }
    await saveDailyTasks(updatedTasks);

    const progressList = get().progress;
    const progressIndex = progressList.findIndex(
      p => p.subject === battle.subject && p.levelNumber === battle.levelNumber
    );

    if (progressIndex !== -1 && battle.result === 'win') {
      const nextList = [...progressList];
      nextList[progressIndex] = {
        ...nextList[progressIndex],
        status: 'passed',
        passedAt: Date.now()
      };

      // Unlock next level for all subjects when current trio is fully passed
      const nextLevelNumber = battle.levelNumber + 1;
      if (nextLevelNumber <= LEVEL_COUNT) {
        for (const subject of (['chinese', 'math', 'english'] as Subject[])) {
          const idx = nextList.findIndex(p => p.subject === subject && p.levelNumber === nextLevelNumber);
          if (idx !== -1 && nextList[idx].status === 'locked') {
            nextList[idx] = { ...nextList[idx], status: 'unlocked' };
          }
        }
      }

      await saveProgressBatch(nextList);

      // 三科同号全过则推进统一关号并累加今日通关数
      const trio = (['chinese', 'math', 'english'] as Subject[]).map(s =>
        nextList.find(p => p.subject === s && p.levelNumber === battle.levelNumber)
      );
      if (trio.every(p => p?.status === 'passed')) {
        const profileStore = useProfileStore.getState();
        const currentProfile = profileStore.profile;
        if (currentProfile) {
          const nextProfile = advanceCurrentLevel(markDailyPass(currentProfile));
          await profileStore.updateProfile(nextProfile);
        }
      }

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

export { LEVEL_COUNT } from '../data/v3';
