import type { EquipmentDef, EquipmentSlot, InventoryItem, Profile } from '../types';

export const EQUIPMENT_CATALOG: EquipmentDef[] = [
  // 武器
  {
    id: 'wooden-sword',
    name: '木剑',
    slot: 'weapon',
    icon: '🗡️',
    level: 1,
    description: '初学者的小木剑，挥舞起来虎虎生风。',
    attackBonus: 2,
    starCost: 10
  },
  {
    id: 'iron-sword',
    name: '铁剑',
    slot: 'weapon',
    icon: '⚔️',
    level: 3,
    description: '更锋利的铁剑，能造成更大的伤害。',
    attackBonus: 4,
    starCost: 25
  },
  {
    id: 'magic-wand',
    name: '魔法杖',
    slot: 'weapon',
    icon: '🔮',
    level: 5,
    description: '蕴含魔力的法杖，攻击时更容易打出暴击。',
    attackBonus: 3,
    critBonus: 0.1,
    starCost: 50
  },
  // 盾牌
  {
    id: 'small-wooden-shield',
    name: '小木盾',
    slot: 'shield',
    icon: '🛡️',
    level: 1,
    description: '小小的木盾，能提供基础保护。',
    hpBonus: 10,
    starCost: 10
  },
  {
    id: 'knight-shield',
    name: '骑士盾',
    slot: 'shield',
    icon: '🔰',
    level: 3,
    description: '坚固的骑士盾，让勇士能承受更多伤害。',
    hpBonus: 20,
    starCost: 25
  },
  // 法杖（暴击）
  {
    id: 'wisdom-staff',
    name: '智慧法杖',
    slot: 'staff',
    icon: '🪄',
    level: 1,
    description: '智慧的加成，让攻击更容易命中要害。',
    critBonus: 0.15,
    starCost: 15
  },
  {
    id: 'crit-staff',
    name: '暴击法杖',
    slot: 'staff',
    icon: '✨',
    level: 4,
    description: '专为暴击而生的法杖，威力惊人。',
    critBonus: 0.25,
    starCost: 35
  },
  // 鞋子
  {
    id: 'light-shoes',
    name: '轻便鞋',
    slot: 'shoes',
    icon: '👟',
    level: 1,
    description: '轻便的鞋子，让答题时间更充裕。',
    timeBonus: 3000,
    starCost: 15
  },
  {
    id: 'swift-shoes',
    name: '疾风鞋',
    slot: 'shoes',
    icon: '🥾',
    level: 4,
    description: '如风一般迅捷，大幅延长答题时限。',
    timeBonus: 5000,
    starCost: 35
  }
];

export function getEquipmentDef(id: string): EquipmentDef | undefined {
  return EQUIPMENT_CATALOG.find(item => item.id === id);
}

export function listEquipmentBySlot(slot: EquipmentSlot): EquipmentDef[] {
  return EQUIPMENT_CATALOG.filter(item => item.slot === slot);
}

export interface EquipmentBonuses {
  attackBonus: number;
  hpBonus: number;
  critBonus: number;
  timeBonus: number;
}

export function computeEquipmentBonuses(
  inventory: InventoryItem[],
  equippedItems: Profile['equippedItems']
): EquipmentBonuses {
  const owned = new Set(inventory.filter(item => item.count > 0).map(item => item.id));
  const bonuses: EquipmentBonuses = {
    attackBonus: 0,
    hpBonus: 0,
    critBonus: 0,
    timeBonus: 0
  };

  for (const [slot, itemId] of Object.entries(equippedItems) as [EquipmentSlot, string | undefined][]) {
    if (!itemId || !owned.has(itemId)) continue;
    const def = getEquipmentDef(itemId);
    if (!def || def.slot !== slot) continue;

    bonuses.attackBonus += def.attackBonus ?? 0;
    bonuses.hpBonus += def.hpBonus ?? 0;
    bonuses.critBonus += def.critBonus ?? 0;
    bonuses.timeBonus += def.timeBonus ?? 0;
  }

  return bonuses;
}

export function equipItem(
  equippedItems: Profile['equippedItems'],
  slot: EquipmentSlot,
  itemId: string,
  inventory: InventoryItem[],
  playerLevel: number
): { equippedItems: Profile['equippedItems']; error?: string } {
  const owned = inventory.find(item => item.id === itemId && item.count > 0);
  if (!owned) {
    return { equippedItems, error: '背包中不存在该装备' };
  }

  const def = getEquipmentDef(itemId);
  if (!def) {
    return { equippedItems, error: '装备不存在' };
  }

  if (def.level > playerLevel) {
    return { equippedItems, error: `需要等级 Lv.${def.level}` };
  }

  if (def.slot !== slot) {
    return { equippedItems, error: `该装备属于 ${def.slot} 槽位` };
  }

  return {
    equippedItems: { ...equippedItems, [slot]: itemId }
  };
}

export function unequipItem(
  equippedItems: Profile['equippedItems'],
  slot: EquipmentSlot
): Profile['equippedItems'] {
  const next = { ...equippedItems };
  delete next[slot];
  return next;
}
