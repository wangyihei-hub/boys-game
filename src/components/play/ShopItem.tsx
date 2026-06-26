import type { InventoryItem } from '../../types';
import { Star } from 'lucide-react';

interface ShopItemProps {
  item: Omit<InventoryItem, 'count'>;
  cost: number;
  canAfford: boolean;
  onBuy: (item: Omit<InventoryItem, 'count'>, cost: number) => void;
}

const TYPE_LABELS: Record<InventoryItem['type'], string> = {
  skin: '装扮',
  effect: '特效',
  furniture: '家具',
  pet_food: '宠物食物',
  lottery_ticket: '抽奖券',
  fragment: '碎片'
};

export function ShopItem({ item, cost, canAfford, onBuy }: ShopItemProps) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
          {item.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">{item.name}</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
              {TYPE_LABELS[item.type]}
            </span>
          </div>
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
          disabled={!canAfford}
          className={[
            'rounded-xl px-4 py-2 text-sm font-semibold shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
            canAfford
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-slate-200 text-slate-500'
          ].join(' ')}
        >
          {canAfford ? '购买' : '星星不足'}
        </button>
      </div>
    </div>
  );
}
