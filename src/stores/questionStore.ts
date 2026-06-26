import { create } from 'zustand';
import type { Difficulty, Question, Subject } from '../types';
import { deleteQuestions as deleteQuestionsFromDB, getQuestions, saveQuestions } from '../db';
import { getSeedQuestionsBySubjectAndDifficulty } from '../data/seedQuestions';

interface QuestionState {
  questions: Question[];
  loaded: boolean;
  error: string | null;
  loadQuestions: () => Promise<void>;
  saveGeneratedQuestions: (questions: Question[]) => Promise<void>;
  deleteQuestions: (ids: string[]) => Promise<void>;
  getQuestionsForBattle: (subject: Subject, difficulty: Difficulty, count: number) => Question[];
  clearError: () => void;
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
  questions: [],
  loaded: false,
  error: null,
  async loadQuestions() {
    try {
      const questions = await getQuestions();
      set({ questions, loaded: true, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载题库失败', loaded: true });
    }
  },
  async saveGeneratedQuestions(questions) {
    try {
      await saveQuestions(questions);
      const byId = new Map(get().questions.map(q => [q.id, q]));
      for (const q of questions) {
        byId.set(q.id, q);
      }
      set({ questions: Array.from(byId.values()), error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存题目失败' });
    }
  },
  async deleteQuestions(ids) {
    try {
      await deleteQuestionsFromDB(ids);
      const idSet = new Set(ids);
      set({ questions: get().questions.filter(q => !idSet.has(q.id)), error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除题目失败' });
    }
  },
  getQuestionsForBattle(subject, difficulty, count) {
    const userQuestions = get().questions.filter(
      q => q.subject === subject && q.difficulty === difficulty
    );
    const seedQuestions = getSeedQuestionsBySubjectAndDifficulty(subject, difficulty);
    const pool = [...userQuestions, ...seedQuestions];
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },
  clearError() {
    set({ error: null });
  }
}));
