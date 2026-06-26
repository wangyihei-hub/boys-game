import { useState } from 'react';
import type { Reward, RewardCategory } from '../../types';
import {
  REWARD_CATEGORIES,
  REWARD_CATEGORY_LABELS,
  createRewardId,
  validateRewardFields
} from '../../services/economyLogic';

interface RewardFormProps {
  reward?: Reward;
  onSave: (reward: Reward) => Promise<void>;
  onCancel: () => void;
}

const CATEGORY_COLORS: Record<RewardCategory, string> = {
  food: 'bg-orange-100 text-orange-700 border-orange-300',
  privilege: 'bg-purple-100 text-purple-700 border-purple-300',
  learning: 'bg-blue-100 text-blue-700 border-blue-300',
  mystery: 'bg-pink-100 text-pink-700 border-pink-300'
};

export function RewardForm({ reward, onSave, onCancel }: RewardFormProps) {
  const [name, setName] = useState(reward?.name ?? '');
  const [category, setCategory] = useState<RewardCategory>(reward?.category ?? 'food');
  const [starCost, setStarCost] = useState(reward?.starCost ?? 50);
  const [stock, setStock] = useState(reward?.stock ?? 0);
  const [description, setDescription] = useState(reward?.description ?? '');
  const [icon, setIcon] = useState(reward?.icon ?? '🎁');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(reward);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Reward = {
      id: reward?.id ?? createRewardId(),
      name: name.trim(),
      category,
      starCost,
      stock,
      description: description.trim(),
      icon: icon.trim() || '🎁'
    };
    const validation = validateRewardFields(next);
    if (!validation.valid) {
      setError(validation.error ?? '请检查输入');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="reward-name" className="block text-sm font-semibold text-slate-700">
          奖励名称
        </label>
        <input
          id="reward-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例如：周末出游"
          className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
        />
      </div>

      <div className="space-y-1">
        <span className="block text-sm font-semibold text-slate-700">分类</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {REWARD_CATEGORIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={[
                'rounded-xl border-2 px-2 py-2 text-sm font-semibold transition-all',
                CATEGORY_COLORS[c],
                category === c ? 'ring-2 ring-indigo-400 ring-offset-1' : 'opacity-70 hover:opacity-100'
              ].join(' ')}
            >
              {REWARD_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="reward-cost" className="block text-sm font-semibold text-slate-700">
            星星价格
          </label>
          <input
            id="reward-cost"
            type="number"
            min={1}
            value={starCost}
            onChange={e => setStarCost(Math.max(1, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="reward-stock" className="block text-sm font-semibold text-slate-700">
            库存（0=不限）
          </label>
          <input
            id="reward-stock"
            type="number"
            min={0}
            value={stock}
            onChange={e => setStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1 space-y-1">
          <label htmlFor="reward-icon" className="block text-sm font-semibold text-slate-700">
            图标
          </label>
          <input
            id="reward-icon"
            type="text"
            value={icon}
            onChange={e => setIcon(e.target.value.slice(0, 2))}
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-center text-xl outline-none focus:border-indigo-500"
          />
        </div>
        <div className="col-span-3 space-y-1">
          <label htmlFor="reward-desc" className="block text-sm font-semibold text-slate-700">
            说明
          </label>
          <input
            id="reward-desc"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="奖励的详细说明"
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex-1 disabled:opacity-60"
        >
          {saving ? '保存中…' : isEditing ? '更新奖励' : '添加奖励'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="btn-secondary disabled:opacity-60"
        >
          取消
        </button>
      </div>
    </form>
  );
}
