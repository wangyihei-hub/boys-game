import { describe, expect, it, beforeEach } from 'vitest';
import {
  useGameStore,
  LEVEL_COUNT,
  computeSubjectProgress,
  computeCurrentLevel,
  isLevelUnlocked
} from '../src/stores/gameStore';
import { useProfileStore } from '../src/stores/profileStore';
import { resetDB, saveProgressBatch } from '../src/db';
import type { Question, Subject } from '../src/types';

function createBattleQuestions(count: number, subject: Subject = 'math'): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${subject[0]}-L001-Q${String(i + 1).padStart(2, '0')}`,
    subject,
    topic: 'test',
    difficulty: 1,
    type: 'choice' as const,
    question: `q${i + 1}`,
    options: ['A', 'B', 'C', 'D'],
    answer: 0,
    explanation: 'test',
    generatedAt: 0
  }));
}

function winBattle(store: ReturnType<typeof useGameStore.getState>, subject: Subject, levelNumber: number) {
  const questions = createBattleQuestions(3, subject);
  store.startBattle(subject, levelNumber, questions);
  for (let i = 0; i < questions.length; i++) {
    store.submitAnswer(0, 1);
  }
  return store.finishBattle(1, 0);
}

describe('gameStore', () => {
  beforeEach(async () => {
    await resetDB();
    useGameStore.setState({
      progress: [],
      loaded: false,
      error: null,
      currentBattle: null,
      lastBattleRecord: null
    });
    useProfileStore.setState({
      profile: null,
      achievements: [],
      dailyStats: null,
      loaded: false,
      error: null
    });
    await useProfileStore.getState().loadProfile();
  });

  it('initializes default progress on first load', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    const state = useGameStore.getState();
    expect(state.progress.length).toBe(LEVEL_COUNT * 3);
    expect(state.loaded).toBe(true);

    const firstChinese = state.progress.find(p => p.subject === 'chinese' && p.levelNumber === 1);
    expect(firstChinese?.status).toBe('unlocked');
    const secondChinese = state.progress.find(p => p.subject === 'chinese' && p.levelNumber === 2);
    expect(secondChinese?.status).toBe('locked');
  });

  it('reloads existing progress from db', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    const updated = useGameStore.getState().progress.map(p =>
      p.subject === 'chinese' && p.levelNumber === 1 ? { ...p, status: 'passed' as const } : p
    );
    await saveProgressBatch(updated);
    await useGameStore.getState().loadProgress();
    const reloaded = useGameStore.getState().progress.find(
      p => p.subject === 'chinese' && p.levelNumber === 1
    );
    expect(reloaded?.status).toBe('passed');
  });

  it('computes subject progress', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    useGameStore.setState(state => ({
      progress: state.progress.map(p =>
        p.subject === 'math' ? { ...p, status: 'passed' as const } : p
      )
    }));
    const { passed, total } = computeSubjectProgress(useGameStore.getState().progress, 'math');
    expect(total).toBe(LEVEL_COUNT);
    expect(passed).toBe(LEVEL_COUNT);
  });

  it('computes current unified level', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    expect(computeCurrentLevel(useGameStore.getState().progress)).toBe(1);

    const progress = useGameStore.getState().progress.map(p =>
      p.levelNumber === 1 ? { ...p, status: 'passed' as const } : p
    );
    useGameStore.setState({ progress });
    expect(computeCurrentLevel(progress)).toBe(2);
  });

  it('reports level unlock state based on previous trio', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    const progress = useGameStore.getState().progress;

    expect(isLevelUnlocked(progress, 1)).toBe(true);
    expect(isLevelUnlocked(progress, 2)).toBe(false);

    const passedLevel1 = progress.map(p =>
      p.levelNumber === 1 ? { ...p, status: 'passed' as const } : p
    );
    expect(isLevelUnlocked(passedLevel1, 2)).toBe(true);
  });

  it('starts a battle', () => {
    const store = useGameStore.getState();
    const questions = createBattleQuestions(3, 'math');
    store.startBattle('math', 1, questions);
    const state = useGameStore.getState();
    expect(state.currentBattle).not.toBeNull();
    expect(state.currentBattle?.subject).toBe('math');
    expect(state.currentBattle?.levelNumber).toBe(1);
    expect(state.currentBattle?.questions.length).toBe(3);
  });

  it('unlocks next level for all subjects after a trio pass', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();

    await winBattle(store, 'chinese', 1);
    await winBattle(store, 'math', 1);
    const result = await winBattle(store, 'english', 1);
    expect(result.result).toBe('win');

    const nextProgress = useGameStore.getState().progress;
    for (const subject of (['chinese', 'math', 'english'] as Subject[])) {
      const p = nextProgress.find(pr => pr.subject === subject && pr.levelNumber === 2);
      expect(p?.status).toBe('unlocked');
    }
  });

  it('advances unified level and daily pass count when trio is passed', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    const initialProfile = useProfileStore.getState().profile;
    expect(initialProfile?.currentLevelNumber).toBe(1);
    expect(initialProfile?.dailyPassCount).toBe(0);

    await winBattle(store, 'chinese', 1);
    await winBattle(store, 'math', 1);
    await winBattle(store, 'english', 1);

    const profile = useProfileStore.getState().profile;
    expect(profile?.currentLevelNumber).toBe(2);
    expect(profile?.dailyPassCount).toBe(1);
  });

  it('records lose result without unlocking next level', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    const questions = createBattleQuestions(3, 'chinese');
    store.startBattle('chinese', 1, questions);
    store.submitAnswer(1, 1); // wrong answer
    const result = await store.finishBattle(1, 0);
    expect(result.result).toBe('lose');

    const progress = useGameStore.getState().progress;
    const chineseLevel1 = progress.find(p => p.subject === 'chinese' && p.levelNumber === 1);
    expect(chineseLevel1?.status).toBe('unlocked');
    const chineseLevel2 = progress.find(p => p.subject === 'chinese' && p.levelNumber === 2);
    expect(chineseLevel2?.status).toBe('locked');
  });
});
