import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { EquipmentSlot } from '../../types';
import { useProfileStore } from '../../stores/profileStore';
import { useEconomyStore } from '../../stores/economyStore';
import {
  computeEquipmentBonuses,
  equipItem,
  getEquipmentDef,
  unequipItem
} from '../../services/equipmentLogic';
import { EquipmentCard } from './EquipmentCard';

const SLOTS: { key: EquipmentSlot; label: string; icon: string }[] = [
  { key: 'weapon', label: '武器', icon: '⚔️' },
  { key: 'shield', label: '盾牌', icon: '🛡️' },
  { key: 'staff', label: '法杖', icon: '🪄' },
  { key: 'shoes', label: '鞋子', icon: '👟' }
];

export function EquipmentPanel() {
  const profile = useProfileStore(state => state.profile);
  const updateProfile = useProfileStore(state => state.updateProfile);
  const inventory = useEconomyStore(state => state.inventory);
  const loadInventory = useEconomyStore(state => state.loadInventory);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  if (!profile) return null;
  const currentProfile = profile;

  const bonuses = computeEquipmentBonuses(inventory, currentProfile.equippedItems);
  const equipmentItems = inventory.filter(item => item.type === 'equipment' && item.count > 0);

  const grouped: Record<EquipmentSlot, typeof equipmentItems> = {
    weapon: [],
    shield: [],
    staff: [],
    shoes: []
  };
  for (const item of equipmentItems) {
    if (item.slot && grouped[item.slot]) {
      grouped[item.slot].push(item);
    }
  }

  async function handleEquip(slot: EquipmentSlot, itemId: string) {
    const result = equipItem(currentProfile.equippedItems, slot, itemId, inventory, currentProfile.level);
    if (result.error) return;
    await updateProfile({ equippedItems: result.equippedItems });
  }

  async function handleUnequip(slot: EquipmentSlot) {
    const next = unequipItem(currentProfile.equippedItems, slot);
    await updateProfile({ equippedItems: next });
  }

  return (
    <div className="scene-equipment -mx-2 -mt-2 min-h-full rounded-t-3xl p-3 sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="glass-card flex items-center gap-3">
          <Link
            to="/play"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">我的装备</h1>
        </div>

        <div className="glass-card flex flex-wrap gap-2 text-sm">
          <span className="font-bold text-slate-700">总加成：</span>
          {bonuses.attackBonus > 0 && (
            <span className="rounded-lg bg-red-50 px-2 py-0.5 font-semibold text-red-700">
              攻击 +{bonuses.attackBonus}
            </span>
          )}
          {bonuses.hpBonus > 0 && (
            <span className="rounded-lg bg-green-50 px-2 py-0.5 font-semibold text-green-700">
              生命 +{bonuses.hpBonus}
            </span>
          )}
          {bonuses.critBonus > 0 && (
            <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
              暴击 +{Math.round(bonuses.critBonus * 100)}%
            </span>
          )}
          {bonuses.timeBonus > 0 && (
            <span className="rounded-lg bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
              时间 +{bonuses.timeBonus / 1000}s
            </span>
          )}
          {bonuses.attackBonus === 0 &&
            bonuses.hpBonus === 0 &&
            bonuses.critBonus === 0 &&
            bonuses.timeBonus === 0 && (
              <span className="text-slate-500">暂无装备加成</span>
            )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="glass-card space-y-3">
            <h2 className="font-bold text-slate-700">装备槽</h2>
            <div className="relative mx-auto h-48 w-48 rounded-full border-4 border-dashed border-indigo-200 bg-white/50">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl">🧒</div>
              {SLOTS.map(({ key, label, icon }, idx) => {
                const equippedId = currentProfile.equippedItems[key];
                const equippedDef = equippedId ? getEquipmentDef(equippedId) : undefined;
                const angle = (idx * 90 - 45) * (Math.PI / 180);
                const radius = 80;
                const left = 50 + radius * Math.cos(angle);
                const top = 50 + radius * Math.sin(angle);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => equippedDef && handleUnequip(key)}
                    title={equippedDef ? `卸下${label}` : label}
                    className={[
                      'absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border-2 bg-white shadow-sm',
                      equippedDef ? 'border-indigo-300 hover:bg-indigo-50' : 'border-slate-200'
                    ].join(' ')}
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <span className="text-xl">{equippedDef?.icon ?? icon}</span>
                    <span className="text-[10px] text-slate-500">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card space-y-3">
            <h2 className="font-bold text-slate-700">背包</h2>
            {equipmentItems.length === 0 ? (
              <p className="text-center text-sm text-slate-500">背包里没有装备</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {SLOTS.map(({ key, label }) => (
                  <div key={key}>
                    <h3 className="mb-2 text-xs font-bold text-slate-500">{label}</h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {grouped[key].map(item => {
                        const def = getEquipmentDef(item.id);
                        const equipped = currentProfile.equippedItems[key] === item.id;
                        const slotOccupied = !!currentProfile.equippedItems[key] && !equipped;
                        const levelTooLow = !!def && currentProfile.level < def.level;
                        return (
                          <EquipmentCard
                            key={item.id}
                            item={item}
                            equipped={equipped}
                            disabled={slotOccupied || levelTooLow}
                            onEquip={() => handleEquip(key, item.id)}
                            onUnequip={() => handleUnequip(key)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
