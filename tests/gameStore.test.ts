import { describe, expect, it, beforeEach } from 'vitest';
import { useGameStore, STAGES, computeRegionProgress } from '../src/stores/gameStore';
import { resetDB, saveProgressBatch } from '../src/db';
import type { Question } from '../src/types';

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
  });

  it('initializes default progress on first load', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    const state = useGameStore.getState();
    expect(state.progress.length).toBe(STAGES.length);
    expect(state.loaded).toBe(true);
    const firstChinese = state.progress.find(p => p.subject === 'chinese' && p.stageId === 'c1');
    expect(firstChinese?.status).toBe('unlocked');
    const secondChinese = state.progress.find(p => p.subject === 'chinese' && p.stageId === 'c2');
    expect(secondChinese?.status).toBe('locked');
  });

  it('reloads existing progress from db', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    const updated = useGameStore.getState().progress.map(p =>
      p.stageId === 'c1' ? { ...p, status: 'passed' as const } : p
    );
    await saveProgressBatch(updated);
    await useGameStore.getState().loadProgress();
    const reloaded = useGameStore.getState().progress.find(p => p.stageId === 'c1');
    expect(reloaded?.status).toBe('passed');
  });

  it('computes region progress', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    useGameStore.setState(state => ({
      progress: state.progress.map(p =>
        p.subject === 'math' ? { ...p, status: 'passed' as const } : p
      )
    }));
    const { passed, total } = computeRegionProgress(useGameStore.getState().progress, 'math');
    expect(total).toBe(6);
    expect(passed).toBe(6);
  });

  it('starts a battle', () => {
    const store = useGameStore.getState();
    const stage = STAGES[0];
    const questions: Question[] = [
      {
        id: 'q1',
        subject: 'math',
        topic: 'test',
        difficulty: 1,
        type: 'choice',
        question: '1+1=?',
        options: ['1', '2', '3', '4'],
        answer: 1,
        explanation: 'test',
        generatedAt: 0
      }
    ];
    store.startBattle(stage, questions, 1);
    const state = useGameStore.getState();
    expect(state.currentBattle).not.toBeNull();
    expect(state.currentBattle?.stage.id).toBe(stage.id);
    expect(state.currentBattle?.questions.length).toBe(1);
  });

  it('unlocks next stage after winning battle', async () => {
    const store = useGameStore.getState();
    await store.loadProgress();
    const stage = { ...STAGES.find(s => s.id === 'c1')!, monsterHp: 10 };
    const questions: Question[] = [
      {
        id: 'q1',
        subject: 'chinese',
        topic: 'test',
        difficulty: 1,
        type: 'choice',
        question: 'test',
        options: ['A', 'B', 'C', 'D'],
        answer: 0,
        explanation: 'test',
        generatedAt: 0
      }
    ];
    store.startBattle(stage, questions, 1);
    store.submitAnswer(0, 1);
    const result = await store.finishBattle(1, 0);
    expect(result.result).toBe('win');
    const nextStageProgress = useGameStore.getState().progress.find(p => p.stageId === 'c2');
    expect(nextStageProgress?.status).toBe('unlocked');
  });
});
