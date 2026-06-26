import type { Reward } from '../../types';
import { REWARD_CATEGORY_LABELS } from '../../services/economyLogic';
import { Star } from 'lucide-react';

interface RewardItemProps {
  reward: Reward;
  canAfford: boolean;
  onRedeem: (reward: Reward) => void;
}

const CATEGORY_COLORS: Record<Reward['category'], string> = {
  food: 'border-orange-200 bg-orange-50',
  privilege: 'border-purple-200 bg-purple-50',
  learning: 'border-blue-200 bg-blue-50',
  mystery: 'border-pink-200 bg-pink-50'
};

export function RewardItem({ reward, canAfford, onRedeem }: RewardItemProps) {
  const isAvailable = reward.stock === 0 || reward.stock > 0;
  const disabled = !canAfford || !isAvailable;
  const stockText = reward.stock === 0 ? '不限量' : `剩 ${reward.stock}`;

  return (
    <div className={['card flex flex-col gap-3', CATEGORY_COLORS[reward.category]].join(' ')}>
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
          {reward.icon || '🎁'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">{reward.name}</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
              {REWARD_CATEGORY_LABELS[reward.category]}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-600">{reward.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 font-bold text-yellow-600">
            <Star className="h-4 w-4 fill-current" />
            {reward.starCost}
          </div>
          <span className="text-slate-500">库存：{stockText}</span>
        </div>
        <button
          type="button"
          onClick={() => onRedeem(reward)}
          disabled={disabled}
          className={[
            'rounded-xl px-4 py-2 text-sm font-semibold shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
            disabled
              ? 'bg-slate-200 text-slate-500'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          ].join(' ')}
        >
          {!canAfford ? '星星不足' : !isAvailable ? '已兑完' : '兑换'}
        </button>
      </div>
    </div>
  );
}
