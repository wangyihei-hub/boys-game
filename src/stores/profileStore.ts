import { create } from 'zustand';
import type { Profile } from '../types';
import { getProfile, saveProfile } from '../db';

interface ProfileState {
  profile: Profile | null;
  loaded: boolean;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  addStars: (amount: number) => Promise<void>;
}

const DEFAULT_PROFILE: Profile = {
  id: 'default',
  nickname: '小勇士',
  level: 1,
  exp: 0,
  stars: 0,
  equippedItems: {},
  createdAt: Date.now()
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loaded: false,
  async loadProfile() {
    let profile = await getProfile('default');
    if (!profile) {
      profile = DEFAULT_PROFILE;
      await saveProfile(profile);
    }
    set({ profile, loaded: true });
  },
  async updateProfile(updates) {
    const current = get().profile;
    if (!current) return;
    const next = { ...current, ...updates };
    await saveProfile(next);
    set({ profile: next });
  },
  async addStars(amount) {
    const current = get().profile;
    if (!current) return;
    const next = { ...current, stars: Math.max(0, current.stars + amount) };
    await saveProfile(next);
    set({ profile: next });
  }
}));
