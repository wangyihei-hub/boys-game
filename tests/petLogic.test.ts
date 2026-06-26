import { describe, expect, it } from 'vitest';
import {
  checkEvolution,
  computePetSkillEffect,
  createPetInstance,
  evolvePet,
  feedPet,
  getPetDef,
  getPetInstance,
  listPets
} from '../src/services/petLogic';
import type { BattleRecord, DailyTask, InventoryItem } from '../src/types';

function makePetItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'pet-kitty-1',
    name: '小猫',
    type: 'pet',
    icon: '🐱',
    count: 1,
    petDefId: 'kitty',
    evolutionStage: 0,
    bond: 0,
    ...overrides
  };
}

function makeFoodItem(count = 1): InventoryItem {
  return {
    id: 'pet-food',
    name: '宠物饼干',
    type: 'pet_food',
    icon: '🍪',
    count
  };
}

function makeWinRecord(subject: 'chinese' | 'math' | 'english' = 'math'): BattleRecord {
  return {
    id: `win-${Math.random().toString(36).slice(2)}`,
    subject,
    stageId: 'm1',
    result: 'win',
    durationMs: 1000,
    starsEarned: 5,
    expEarned: 10,
    correctAnswers: 1,
    createdAt: Date.now()
  };
}

describe('petLogic', () => {
  it('returns the correct pet definition by id', () => {
    const def = getPetDef('kitty');
    expect(def).toBeDefined();
    expect(def?.name).toBe('小猫');
    expect(def?.skill).toBe('hint');
  });

  it('lists all pets', () => {
    const pets = listPets();
    expect(pets.length).toBeGreaterThan(0);
    expect(pets.some(p => p.id === 'kitty')).toBe(true);
    expect(pets.some(p => p.id === 'puppy')).toBe(true);
  });

  it('returns undefined for unknown pet id', () => {
    expect(getPetDef('not-a-pet')).toBeUndefined();
  });

  it('creates a pet instance with initial stage and bond', () => {
    const item = createPetInstance('kitty');
    expect(item.type).toBe('pet');
    expect(item.petDefId).toBe('kitty');
    expect(item.evolutionStage).toBe(0);
    expect(item.bond).toBe(0);
    expect(item.count).toBe(1);
  });

  it('gets active pet instance from inventory', () => {
    const item = makePetItem();
    const instance = getPetInstance([item], item.id);
    expect(instance).toBeDefined();
    expect(instance?.item.id).toBe(item.id);
    expect(instance?.def.id).toBe('kitty');
  });

  it('returns undefined when no active pet is set', () => {
    expect(getPetInstance([makePetItem()], undefined)).toBeUndefined();
  });

  it('feeds a pet and consumes one food', () => {
    const pet = makePetItem();
    const food = makeFoodItem(2);
    const { inventory, error } = feedPet([pet, food], pet.id, food.id);
    expect(error).toBeUndefined();
    const updatedPet = inventory.find(i => i.id === pet.id);
    const updatedFood = inventory.find(i => i.id === food.id);
    expect(updatedPet?.bond).toBe(5);
    expect(updatedFood?.count).toBe(1);
  });

  it('returns error when feeding without food', () => {
    const pet = makePetItem();
    const { inventory, error } = feedPet([pet], pet.id, 'pet-food');
    expect(error).toBe('没有宠物食物');
    expect(inventory).toEqual([pet]);
  });

  it('caps bond at the next evolution requirement', () => {
    const pet = makePetItem({ bond: 8 });
    const food = makeFoodItem(1);
    const { inventory } = feedPet([pet, food], pet.id, food.id);
    const updatedPet = inventory.find(i => i.id === pet.id);
    expect(updatedPet?.bond).toBe(10);
  });

  it('describes evolution requirements correctly', () => {
    const pet = makePetItem({ bond: 10 });
    const records: BattleRecord[] = Array.from({ length: 20 }, () => makeWinRecord());
    const result = checkEvolution(
      { item: pet, def: getPetDef('kitty')! },
      records,
      []
    );
    expect(result.requirementText).toContain('累计答对 20 题');
    expect(result.requirementText).toContain('亲密度 10/10');
    expect(result.canEvolve).toBe(true);
  });

  it('does not allow evolution when battle records are insufficient', () => {
    const pet = makePetItem({ bond: 10 });
    const records: BattleRecord[] = Array.from({ length: 5 }, () => makeWinRecord());
    const result = checkEvolution(
      { item: pet, def: getPetDef('kitty')! },
      records,
      []
    );
    expect(result.canEvolve).toBe(false);
  });

  it('evolves a pet when conditions are met', () => {
    const pet = makePetItem({ bond: 10 });
    const food = makeFoodItem(1);
    const records: BattleRecord[] = Array.from({ length: 20 }, () => makeWinRecord());
    const { inventory, error } = evolvePet([pet, food], pet.id, records, []);
    expect(error).toBeUndefined();
    const updatedPet = inventory.find(i => i.id === pet.id);
    expect(updatedPet?.evolutionStage).toBe(1);
  });

  it('returns error when evolution conditions are not met', () => {
    const pet = makePetItem({ bond: 5 });
    const { inventory, error } = evolvePet([pet], pet.id, [], []);
    expect(error).toBe('进化条件不足');
    expect(inventory.find(i => i.id === pet.id)?.evolutionStage).toBe(0);
  });

  it('scales pet skill effect with evolution stage', () => {
    const baseSprite = {
      item: makePetItem({ petDefId: 'sprite', evolutionStage: 0 }),
      def: getPetDef('sprite')!
    };
    const evolvedSprite = {
      item: makePetItem({ petDefId: 'sprite', evolutionStage: 1 }),
      def: getPetDef('sprite')!
    };

    const baseEffect = computePetSkillEffect(baseSprite);
    const evolvedEffect = computePetSkillEffect(evolvedSprite);

    expect(baseEffect.skill).toBe('heal');
    expect(evolvedEffect.skill).toBe('heal');
    expect(evolvedEffect.healAmount).toBeGreaterThan(baseEffect.healAmount ?? 0);
  });

  it('scales double stars chance with evolution stage', () => {
    const baseStar = {
      item: makePetItem({ petDefId: 'lucky-star', evolutionStage: 0 }),
      def: getPetDef('lucky-star')!
    };
    const evolvedStar = {
      item: makePetItem({ petDefId: 'lucky-star', evolutionStage: 1 }),
      def: getPetDef('lucky-star')!
    };

    const baseEffect = computePetSkillEffect(baseStar);
    const evolvedEffect = computePetSkillEffect(evolvedStar);

    expect(baseEffect.doubleStarsChance).toBeGreaterThan(0);
    expect(evolvedEffect.doubleStarsChance).toBeGreaterThan(baseEffect.doubleStarsChance ?? 0);
  });

  it('checks consecutive day requirement from daily tasks', () => {
    const pet = makePetItem({ petDefId: 'sprite', bond: 30 });
    const tasks: DailyTask[] = [
      { id: '2024-01-01-login', title: '登录', type: 'login', target: 1, rewardStars: 2, completed: true, progress: 1, dateKey: '2024-01-01' },
      { id: '2024-01-02-login', title: '登录', type: 'login', target: 1, rewardStars: 2, completed: true, progress: 1, dateKey: '2024-01-02' },
      { id: '2024-01-03-login', title: '登录', type: 'login', target: 1, rewardStars: 2, completed: true, progress: 1, dateKey: '2024-01-03' }
    ];
    const result = checkEvolution(
      { item: pet, def: getPetDef('sprite')! },
      [],
      tasks
    );
    expect(result.requirementText).toContain('连续打卡 3 天');
    expect(result.canEvolve).toBe(true);
  });
});
