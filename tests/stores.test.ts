import { describe, it, expect, beforeEach } from 'vitest';
import { useProfileStore } from '../src/stores/profileStore';
import { useParentStore } from '../src/stores/parentStore';
import { getDB } from '../src/db';
import type { Reward, Redemption } from '../src/types';

describe('profileStore', () => {
  beforeEach(async () => {
    const db = await getDB();
    await db.clear('profiles');
    useProfileStore.setState({ profile: null, loaded: false });
  });

  it('loads default profile when none exists', async () => {
    await useProfileStore.getState().loadProfile();
    const state = useProfileStore.getState();
    expect(state.loaded).toBe(true);
    expect(state.profile?.nickname).toBe('小勇士');
    expect(state.profile?.stars).toBe(0);
  });

  it('adds stars to profile', async () => {
    await useProfileStore.getState().loadProfile();
    await useProfileStore.getState().addStars(50);
    expect(useProfileStore.getState().profile?.stars).toBe(50);
  });
});

describe('parentStore', () => {
  beforeEach(async () => {
    const db = await getDB();
    await db.clear('parentSettings');
    await db.clear('rewards');
    await db.clear('redemptions');
    useParentStore.setState({ settings: null, rewards: [], redemptions: [], loaded: false });
  });

  it('loads default settings when none exist', async () => {
    await useParentStore.getState().loadParentData();
    const state = useParentStore.getState();
    expect(state.loaded).toBe(true);
    expect(state.settings?.dailyStarLimit).toBe(100);
    expect(state.settings?.dailyMinuteLimit).toBe(45);
  });

  it('adds a reward and persists it', async () => {
    await useParentStore.getState().loadParentData();
    const reward: Reward = {
      id: 'r1',
      name: 'Ice Cream',
      starCost: 10,
      stock: 5,
      category: 'food',
      description: 'Yummy',
      icon: 'ice-cream'
    };
    await useParentStore.getState().addReward(reward);
    expect(useParentStore.getState().rewards).toHaveLength(1);
    expect(useParentStore.getState().rewards[0].name).toBe('Ice Cream');
  });

  it('confirms a redemption', async () => {
    await useParentStore.getState().loadParentData();
    const redemption: Redemption = {
      id: 'red1',
      rewardId: 'r1',
      status: 'pending',
      createdAt: Date.now()
    };
    useParentStore.setState({ redemptions: [redemption] });
    await useParentStore.getState().confirmRedemption('red1');
    const updated = useParentStore.getState().redemptions.find(r => r.id === 'red1');
    expect(updated?.status).toBe('confirmed');
    expect(updated?.confirmedAt).toBeDefined();
  });
});
