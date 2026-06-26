import type { InventoryItem } from '../../types';
import { Star } from 'lucide-react';

interface ShopItemProps {
  item: Omit<InventoryItem, 'count'>;
  cost: number;
  canAfford: boolean;
  disabled?: boolean;
  buttonText?: string;
  badge?: string;
  description?: string;
  onBuy: (item: Omit<InventoryItem, 'count'>, cost: number) => void;
}

const TYPE_LABELS: Record<InventoryItem['type'], string> = {
  skin: '装扮',
  effect: '特效',
  furniture: '家具',
  pet_food: '宠物食物',
  lottery_ticket: '抽奖券',
  fragment: '碎片',
  equipment: '装备',
  pet: '宠物'
};

export function ShopItem({
  item,
  cost,
  canAfford,
  disabled = false,
  buttonText,
  badge,
  description,
  onBuy
}: ShopItemProps) {
  const isDisabled = disabled || !canAfford;
  const label = buttonText ?? (canAfford ? '购买' : '星星不足');

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
          {item.icon}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-800">{item.name}</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
              {TYPE_LABELS[item.type]}
            </span>
            {badge && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 font-bold text-yellow-600">
          <Star className="h-4 w-4 fill-current" />
          {cost}
        </div>
        <button
          type="button"
          onClick={() => onBuy(item, cost)}
          disabled={isDisabled}
          className={[
            'rounded-xl px-4 py-2 text-sm font-semibold shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
            isDisabled
              ? 'bg-slate-200 text-slate-500'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          ].join(' ')}
        >
          {label}
        </button>
      </div>
    </div>
  );
}
