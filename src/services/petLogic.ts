import type { BattleRecord, DailyTask, InventoryItem, PetDef, Subject } from '../types';

export const PET_CATALOG: PetDef[] = [
  {
    id: 'kitty',
    name: '小猫',
    icon: '🐱',
    description: '机灵的小猫，能在战斗中帮你排除一个错误选项。',
    skill: 'hint',
    skillDescription: '提示一个错误选项',
    evolutions: [
      {
        stage: 0,
        name: '小猫',
        icon: '🐱',
        bondRequired: 0,
        requirement: { type: 'correct_count', target: 0 }
      },
      {
        stage: 1,
        name: '灵猫',
        icon: '✨',
        bondRequired: 10,
        requirement: { type: 'correct_count', target: 20 }
      }
    ]
  },
  {
    id: 'puppy',
    name: '小狗',
    icon: '🐶',
    description: '忠诚的小狗，能在战斗中直接排除一个错误选项。',
    skill: 'exclude',
    skillDescription: '排除一个错误选项',
    evolutions: [
      {
        stage: 0,
        name: '小狗',
        icon: '🐶',
        bondRequired: 0,
        requirement: { type: 'subject_correct_count', target: 0, subject: 'math' }
      },
      {
        stage: 1,
        name: '猎犬',
        icon: '🦮',
        bondRequired: 10,
        requirement: { type: 'subject_correct_count', target: 10, subject: 'math' }
      }
    ]
  },
  {
    id: 'sprite',
    name: '小精灵',
    icon: '🧚',
    description: '治愈系小精灵，每答对 3 题会为你恢复生命。',
    skill: 'heal',
    skillDescription: '每答对 3 题恢复生命',
    evolutions: [
      {
        stage: 0,
        name: '小精灵',
        icon: '🧚',
        bondRequired: 0,
        requirement: { type: 'consecutive_days', target: 0 }
      },
      {
        stage: 1,
        name: '精灵王',
        icon: '👑',
        bondRequired: 30,
        requirement: { type: 'consecutive_days', target: 3 }
      }
    ]
  },
  {
    id: 'lucky-star',
    name: '幸运星',
    icon: '⭐',
    description: '带来好运的星星，有机会让战斗奖励翻倍。',
    skill: 'double_stars',
    skillDescription: '概率战斗星星翻倍',
    evolutions: [
      {
        stage: 0,
        name: '幸运星',
        icon: '⭐',
        bondRequired: 0,
        requirement: { type: 'correct_count', target: 0 }
      },
      {
        stage: 1,
        name: '超级幸运星',
        icon: '🌟',
        bondRequired: 30,
        requirement: { type: 'correct_count', target: 50 }
      }
    ]
  }
];

export function getPetDef(id: string): PetDef | undefined {
  return PET_CATALOG.find(pet => pet.id === id);
}

export function listPets(): PetDef[] {
  return [...PET_CATALOG];
}

export interface PetInstance {
  item: InventoryItem;
  def: PetDef;
}

export function getPetInstance(
  inventory: InventoryItem[],
  activePetId?: string
): PetInstance | undefined {
  if (!activePetId) return undefined;
  const item = inventory.find(i => i.id === activePetId && i.type === 'pet');
  if (!item || !item.petDefId) return undefined;
  const def = getPetDef(item.petDefId);
  if (!def) return undefined;
  return { item, def };
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pet-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createPetInstance(petDefId: string): InventoryItem {
  const def = getPetDef(petDefId);
  if (!def) {
    throw new Error(`宠物定义不存在: ${petDefId}`);
  }
  return {
    id: `pet-${petDefId}-${createId()}`,
    name: def.name,
    type: 'pet',
    icon: def.icon,
    count: 1,
    petDefId: def.id,
    evolutionStage: 0,
    bond: 0
  };
}

export interface PetSkillEffect {
  skill: PetDef['skill'];
  hintOptionIndex?: number;
  excludedOptionIndex?: number;
  healAmount?: number;
  doubleStarsChance?: number;
}

export function computePetSkillEffect(petInstance: PetInstance): PetSkillEffect {
  const stage = petInstance.item.evolutionStage ?? 0;
  const effect: PetSkillEffect = { skill: petInstance.def.skill };

  switch (petInstance.def.skill) {
    case 'heal':
      effect.healAmount = 5 + stage * 5;
      break;
    case 'double_stars':
      effect.doubleStarsChance = 0.1 + stage * 0.15;
      break;
    case 'hint':
    case 'exclude':
      break;
  }

  return effect;
}

function getMaxBond(def: PetDef, currentStage: number): number {
  const next = def.evolutions.find(evolution => evolution.stage === currentStage + 1);
  return next?.bondRequired ?? 50;
}

export function feedPet(
  inventory: InventoryItem[],
  petItemId: string,
  foodItemId: string,
  bondIncrement = 5
): { inventory: InventoryItem[]; error?: string } {
  const petIndex = inventory.findIndex(i => i.id === petItemId && i.type === 'pet');
  if (petIndex === -1) {
    return { inventory, error: '宠物不存在' };
  }

  const foodIndex = inventory.findIndex(i => i.id === foodItemId && i.type === 'pet_food');
  if (foodIndex === -1 || inventory[foodIndex].count <= 0) {
    return { inventory, error: '没有宠物食物' };
  }

  const pet = inventory[petIndex];
  const def = getPetDef(pet.petDefId!);
  if (!def) {
    return { inventory, error: '宠物定义不存在' };
  }

  const currentBond = pet.bond ?? 0;
  const maxBond = getMaxBond(def, pet.evolutionStage ?? 0);
  if (currentBond >= maxBond) {
    return { inventory, error: '亲密度已满，请先进化' };
  }

  const nextBond = Math.min(maxBond, currentBond + bondIncrement);
  const nextPet: InventoryItem = { ...pet, bond: nextBond };
  const nextFood: InventoryItem = { ...inventory[foodIndex], count: inventory[foodIndex].count - 1 };

  const nextInventory = inventory
    .map((item, index) => {
      if (index === petIndex) return nextPet;
      if (index === foodIndex) return nextFood;
      return item;
    })
    .filter(item => item.count > 0);

  return { inventory: nextInventory };
}

function subjectLabel(subject: Subject): string {
  const labels: Record<Subject, string> = {
    chinese: '语文',
    math: '数学',
    english: '英语'
  };
  return labels[subject];
}

function requirementText(requirement: PetDef['evolutions'][number]['requirement']): string {
  switch (requirement.type) {
    case 'correct_count':
      return `累计答对 ${requirement.target} 题`;
    case 'subject_correct_count':
      return `${subjectLabel(requirement.subject!)}答对 ${requirement.target} 题`;
    case 'consecutive_days':
      return `连续打卡 ${requirement.target} 天`;
  }
}

function longestConsecutiveDays(tasks: DailyTask[]): number {
  const completedDays = Array.from(
    new Set(tasks.filter(task => task.completed).map(task => task.dateKey))
  ).sort();
  if (completedDays.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < completedDays.length; i++) {
    const prev = new Date(completedDays[i - 1]);
    const curr = new Date(completedDays[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  return maxStreak;
}

function evaluateRequirement(
  requirement: PetDef['evolutions'][number]['requirement'],
  battleRecords: BattleRecord[],
  dailyTasks: DailyTask[]
): { progress: number; met: boolean } {
  switch (requirement.type) {
    case 'correct_count': {
      const progress = battleRecords.filter(record => record.result === 'win').length;
      return { progress, met: progress >= requirement.target };
    }
    case 'subject_correct_count': {
      const progress = battleRecords.filter(
        record => record.result === 'win' && record.subject === requirement.subject
      ).length;
      return { progress, met: progress >= requirement.target };
    }
    case 'consecutive_days': {
      const progress = longestConsecutiveDays(dailyTasks);
      return { progress, met: progress >= requirement.target };
    }
  }
}

export function checkEvolution(
  petInstance: PetInstance,
  battleRecords: BattleRecord[],
  dailyTasks: DailyTask[]
): { canEvolve: boolean; requirementText: string } {
  const { item, def } = petInstance;
  const currentStage = item.evolutionStage ?? 0;
  const nextEvolution = def.evolutions.find(evolution => evolution.stage === currentStage + 1);

  if (!nextEvolution) {
    return { canEvolve: false, requirementText: '已是最高形态' };
  }

  const bondRequired = nextEvolution.bondRequired;
  const bondOk = (item.bond ?? 0) >= bondRequired;
  const { progress, met } = evaluateRequirement(
    nextEvolution.requirement,
    battleRecords,
    dailyTasks
  );

  return {
    canEvolve: bondOk && met,
    requirementText: `${requirementText(nextEvolution.requirement)}（已完成 ${progress}/${nextEvolution.requirement.target}），亲密度 ${item.bond ?? 0}/${bondRequired}`
  };
}

export function evolvePet(
  inventory: InventoryItem[],
  petItemId: string,
  battleRecords: BattleRecord[] = [],
  dailyTasks: DailyTask[] = []
): { inventory: InventoryItem[]; error?: string } {
  const petIndex = inventory.findIndex(i => i.id === petItemId && i.type === 'pet');
  if (petIndex === -1) {
    return { inventory, error: '宠物不存在' };
  }

  const pet = inventory[petIndex];
  const def = getPetDef(pet.petDefId!);
  if (!def) {
    return { inventory, error: '宠物定义不存在' };
  }

  const currentStage = pet.evolutionStage ?? 0;
  const nextEvolution = def.evolutions.find(evolution => evolution.stage === currentStage + 1);
  if (!nextEvolution) {
    return { inventory, error: '已是最高形态' };
  }

  const { canEvolve } = checkEvolution({ item: pet, def }, battleRecords, dailyTasks);
  if (!canEvolve) {
    return { inventory, error: '进化条件不足' };
  }

  const nextPet: InventoryItem = { ...pet, evolutionStage: currentStage + 1 };
  const nextInventory = inventory.map((item, index) =>
    index === petIndex ? nextPet : item
  );

  return { inventory: nextInventory };
}
