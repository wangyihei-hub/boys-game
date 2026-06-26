import { create } from 'zustand';
import type { Question } from '../types';
import { deleteQuestions as deleteQuestionsFromDB, getQuestions, saveQuestions } from '../db';

interface QuestionState {
  questions: Question[];
  loaded: boolean;
  error: string | null;
  loadQuestions: () => Promise<void>;
  saveGeneratedQuestions: (questions: Question[]) => Promise<void>;
  deleteQuestions: (ids: string[]) => Promise<void>;
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
  clearError() {
    set({ error: null });
  }
}));
