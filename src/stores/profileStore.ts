import { create } from 'zustand';
import type { Profile } from '../types';
import { getProfile, saveProfile } from '../db';

interface ProfileState {
  profile: Profile | null;
  loaded: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  addStars: (amount: number) => Promise<void>;
  clearError: () => void;
}

function createDefaultProfile(): Profile {
  return {
    id: 'default',
    nickname: '小勇士',
    level: 1,
    exp: 0,
    stars: 0,
    equippedItems: {},
    createdAt: Date.now()
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loaded: false,
  error: null,
  async loadProfile() {
    try {
      let profile = await getProfile('default');
      if (!profile) {
        profile = createDefaultProfile();
        await saveProfile(profile);
      }
      set({ profile, loaded: true, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载档案失败', loaded: true });
    }
  },
  async updateProfile(updates) {
    try {
      const current = get().profile;
      if (!current) return;
      const next = { ...current, ...updates };
      await saveProfile(next);
      set({ profile: next, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存档案失败' });
    }
  },
  async addStars(amount) {
    try {
      const current = get().profile;
      if (!current) return;
      const next = { ...current, stars: Math.max(0, current.stars + amount) };
      await saveProfile(next);
      set({ profile: next, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存星星失败' });
    }
  },
  clearError() {
    set({ error: null });
  }
}));
