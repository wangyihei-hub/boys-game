import { describe, expect, it } from 'vitest';
import {
  computeEquipmentBonuses,
  equipItem,
  getEquipmentDef,
  listEquipmentBySlot,
  unequipItem
} from '../src/services/equipmentLogic';
import type { EquipmentSlot, InventoryItem, Profile } from '../src/types';

function makeInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'wooden-sword',
    name: '木剑',
    type: 'equipment',
    icon: '🗡️',
    count: 1,
    slot: 'weapon',
    ...overrides
  };
}

describe('equipmentLogic', () => {
  it('returns the correct equipment definition by id', () => {
    const def = getEquipmentDef('wooden-sword');
    expect(def).toBeDefined();
    expect(def?.name).toBe('木剑');
    expect(def?.slot).toBe('weapon');
    expect(def?.attackBonus).toBe(2);
  });

  it('returns undefined for unknown equipment id', () => {
    expect(getEquipmentDef('not-a-real-item')).toBeUndefined();
  });

  it('lists equipment by slot', () => {
    const weapons = listEquipmentBySlot('weapon');
    expect(weapons.length).toBeGreaterThan(0);
    expect(weapons.every(item => item.slot === 'weapon')).toBe(true);

    const shoes = listEquipmentBySlot('shoes');
    expect(shoes.every(item => item.slot === 'shoes')).toBe(true);
  });

  it('sums bonuses from equipped items and ignores backpack items', () => {
    const inventory: InventoryItem[] = [
      makeInventoryItem({ id: 'wooden-sword', slot: 'weapon' }),
      makeInventoryItem({ id: 'small-wooden-shield', slot: 'shield', icon: '🛡️', name: '小木盾' }),
      makeInventoryItem({ id: 'light-shoes', slot: 'shoes', icon: '👟', name: '轻便鞋' }),
      makeInventoryItem({ id: 'wisdom-staff', slot: 'staff', icon: '🪄', name: '智慧法杖' }),
      makeInventoryItem({ id: 'iron-sword', slot: 'weapon', icon: '⚔️', name: '铁剑', count: 1 })
    ];

    const equippedItems: Profile['equippedItems'] = {
      weapon: 'wooden-sword',
      shield: 'small-wooden-shield',
      shoes: 'light-shoes',
      staff: 'wisdom-staff'
    };

    const bonuses = computeEquipmentBonuses(inventory, equippedItems);
    expect(bonuses.attackBonus).toBe(2);
    expect(bonuses.hpBonus).toBe(10);
    expect(bonuses.timeBonus).toBe(3000);
    expect(bonuses.critBonus).toBe(0.15);
  });

  it('ignores equipped items that are not owned', () => {
    const inventory: InventoryItem[] = [
      makeInventoryItem({ id: 'wooden-sword', slot: 'weapon' })
    ];
    const equippedItems: Profile['equippedItems'] = {
      weapon: 'iron-sword'
    };

    const bonuses = computeEquipmentBonuses(inventory, equippedItems);
    expect(bonuses.attackBonus).toBe(0);
  });

  it('ignores equipped items in the wrong slot', () => {
    const inventory: InventoryItem[] = [
      makeInventoryItem({ id: 'wooden-sword', slot: 'weapon' })
    ];
    const equippedItems: Profile['equippedItems'] = {
      shoes: 'wooden-sword'
    };

    const bonuses = computeEquipmentBonuses(inventory, equippedItems);
    expect(bonuses.attackBonus).toBe(0);
  });

  it('equips an item into the matching slot', () => {
    const inventory: InventoryItem[] = [
      makeInventoryItem({ id: 'iron-sword', slot: 'weapon', name: '铁剑', icon: '⚔️' })
    ];
    const result = equipItem({}, 'weapon', 'iron-sword', inventory, 3);
    expect(result.error).toBeUndefined();
    expect(result.equippedItems.weapon).toBe('iron-sword');
  });

  it('rejects equipping an item that does not exist in inventory', () => {
    const result = equipItem({}, 'weapon', 'iron-sword', [], 3);
    expect(result.error).toBe('背包中不存在该装备');
    expect(result.equippedItems.weapon).toBeUndefined();
  });

  it('rejects equipping an item into the wrong slot', () => {
    const inventory: InventoryItem[] = [
      makeInventoryItem({ id: 'wooden-sword', slot: 'weapon' })
    ];
    const result = equipItem({}, 'shoes', 'wooden-sword', inventory, 1);
    expect(result.error).toBe('该装备属于 weapon 槽位');
  });

  it('rejects equipping an item above the player level', () => {
    const inventory: InventoryItem[] = [
      makeInventoryItem({ id: 'iron-sword', slot: 'weapon', name: '铁剑', icon: '⚔️' })
    ];
    const result = equipItem({}, 'weapon', 'iron-sword', inventory, 1);
    expect(result.error).toBe('需要等级 Lv.3');
    expect(result.equippedItems.weapon).toBeUndefined();
  });

  it('replaces the previous item in the same slot', () => {
    const inventory: InventoryItem[] = [
      makeInventoryItem({ id: 'wooden-sword', slot: 'weapon' }),
      makeInventoryItem({ id: 'iron-sword', slot: 'weapon', name: '铁剑', icon: '⚔️' })
    ];
    let equipped: Profile['equippedItems'] = { weapon: 'wooden-sword' };
    const result = equipItem(equipped, 'weapon', 'iron-sword', inventory, 3);
    expect(result.error).toBeUndefined();
    expect(result.equippedItems.weapon).toBe('iron-sword');
  });

  it('removes an item from a slot when unequipping', () => {
    const equipped: Profile['equippedItems'] = { weapon: 'wooden-sword' };
    const next = unequipItem(equipped, 'weapon');
    expect(next.weapon).toBeUndefined();
  });

  it('is safe to unequip a slot that has no item', () => {
    const next = unequipItem({}, 'weapon' as EquipmentSlot);
    expect(next.weapon).toBeUndefined();
  });
});
