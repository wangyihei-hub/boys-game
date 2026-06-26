import type { InventoryItem } from '../../types';
import { getEquipmentDef } from '../../services/equipmentLogic';

export interface EquipmentCardProps {
  item: InventoryItem;
  equipped?: boolean;
  disabled?: boolean;
  onEquip?: () => void;
  onUnequip?: () => void;
}

export function EquipmentCard({ item, equipped, disabled, onEquip, onUnequip }: EquipmentCardProps) {
  const def = getEquipmentDef(item.id);
  if (!def) return null;

  const bonuses: string[] = [];
  if (def.attackBonus) bonuses.push(`攻击 +${def.attackBonus}`);
  if (def.hpBonus) bonuses.push(`生命 +${def.hpBonus}`);
  if (def.critBonus) bonuses.push(`暴击 +${Math.round(def.critBonus * 100)}%`);
  if (def.timeBonus) bonuses.push(`时间 +${def.timeBonus / 1000}s`);

  return (
    <div className="card flex flex-col gap-2 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
          {def.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-700">{def.name}</p>
          <p className="text-xs text-slate-500">
            Lv.{def.level} · {def.starCost ? `⭐${def.starCost}` : '免费'}
          </p>
        </div>
      </div>

      {bonuses.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bonuses.map(text => (
            <span
              key={text}
              className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700"
            >
              {text}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1 flex gap-2">
        {equipped ? (
          <button
            type="button"
            onClick={onUnequip}
            className="btn-secondary flex-1 py-1.5 text-sm"
          >
            卸下
          </button>
        ) : (
          <button
            type="button"
            onClick={onEquip}
            disabled={disabled || !onEquip}
            className="btn-primary flex-1 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            装备
          </button>
        )}
      </div>
    </div>
  );
}
