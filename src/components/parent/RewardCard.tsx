import type { Reward } from '../../types';
import { REWARD_CATEGORY_LABELS } from '../../services/economyLogic';
import { Pencil, Trash2 } from 'lucide-react';

interface RewardCardProps {
  reward: Reward;
  onEdit: (reward: Reward) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS: Record<Reward['category'], string> = {
  food: 'border-orange-300 bg-orange-50',
  privilege: 'border-purple-300 bg-purple-50',
  learning: 'border-blue-300 bg-blue-50',
  mystery: 'border-pink-300 bg-pink-50'
};

export function RewardCard({ reward, onEdit, onDelete }: RewardCardProps) {
  const stockText = reward.stock === 0 ? '不限' : `剩 ${reward.stock}`;

  return (
    <div className={['card relative flex flex-col gap-2', CATEGORY_COLORS[reward.category]].join(' ')}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
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
          <span className="font-bold text-yellow-600">{reward.starCost} 星星</span>
          <span className="text-slate-500">库存：{stockText}</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(reward)}
            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-indigo-600"
            aria-label={`编辑 ${reward.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(reward.id)}
            className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-red-600"
            aria-label={`删除 ${reward.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
