import { useState } from 'react';
import type { LotteryPrize, PrizeType } from '../../types';

interface LotteryPrizeFormProps {
  prize?: LotteryPrize;
  onSave: (prize: LotteryPrize) => Promise<void>;
  onCancel: () => void;
}

const TYPE_LABELS: Record<PrizeType, string> = {
  stars: '星星',
  fragment: '实物碎片',
  privilege: '特权卡',
  virtual: '虚拟道具'
};

export function LotteryPrizeForm({ prize, onSave, onCancel }: LotteryPrizeFormProps) {
  const [name, setName] = useState(prize?.name ?? '');
  const [type, setType] = useState<PrizeType>(prize?.type ?? 'stars');
  const [amount, setAmount] = useState<number | undefined>(prize?.amount ?? 5);
  const [icon, setIcon] = useState(prize?.icon ?? '⭐');
  const [probability, setProbability] = useState(prize?.probability ?? 0.2);
  const [stock, setStock] = useState(prize?.stock ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(prize);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入奖品名称');
      return;
    }
    if (probability < 0 || probability > 1) {
      setError('概率必须在 0-1 之间');
      return;
    }
    if (stock < 0) {
      setError('库存不能为负数');
      return;
    }

    const next: LotteryPrize = {
      id: prize?.id ?? ``,
      name: name.trim(),
      type,
      amount: type === 'stars' ? (amount ?? 0) : undefined,
      icon: icon.trim() || '⭐',
      probability,
      stock
    };

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
        <label htmlFor="prize-type" className="block text-sm font-semibold text-slate-700">
          奖品类型
        </label>
        <select
          id="prize-type"
          value={type}
          onChange={e => setType(e.target.value as PrizeType)}
          className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="prize-name" className="block text-sm font-semibold text-slate-700">
          奖品名称
        </label>
        <input
          id="prize-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例如：小星星 5"
          className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
        />
      </div>

      {type === 'stars' && (
        <div className="space-y-1">
          <label htmlFor="prize-amount" className="block text-sm font-semibold text-slate-700">
            星星数量
          </label>
          <input
            id="prize-amount"
            type="number"
            min={0}
            value={amount ?? 0}
            onChange={e => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label htmlFor="prize-icon" className="block text-sm font-semibold text-slate-700">
            图标
          </label>
          <input
            id="prize-icon"
            type="text"
            value={icon}
            onChange={e => setIcon(e.target.value.slice(0, 2))}
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-center text-xl outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="prize-probability" className="block text-sm font-semibold text-slate-700">
            概率
          </label>
          <input
            id="prize-probability"
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={probability}
            onChange={e => setProbability(parseFloat(e.target.value))}
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="prize-stock" className="block text-sm font-semibold text-slate-700">
            库存
          </label>
          <input
            id="prize-stock"
            type="number"
            min={0}
            value={stock}
            onChange={e => setStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
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
          {saving ? '保存中…' : isEditing ? '更新奖品' : '添加奖品'}
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
