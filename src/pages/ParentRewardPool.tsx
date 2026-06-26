import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Plus, ArrowLeft } from 'lucide-react';
import { useParentStore } from '../stores/parentStore';
import { RewardForm } from '../components/parent/RewardForm';
import { RewardCard } from '../components/parent/RewardCard';
import { DEFAULT_REWARDS, createRewardId } from '../services/economyLogic';
import type { Reward } from '../types';

export function ParentRewardPool() {
  const rewards = useParentStore(state => state.rewards);
  const addReward = useParentStore(state => state.addReward);
  const updateReward = useParentStore(state => state.updateReward);
  const deleteReward = useParentStore(state => state.deleteReward);
  const [editing, setEditing] = useState<Reward | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  const handleAddDefault = async () => {
    const existingNames = new Set(rewards.map(r => r.name));
    const toAdd = DEFAULT_REWARDS.filter(r => !existingNames.has(r.name)).map(r => ({ ...r, id: createRewardId() }));
    for (const reward of toAdd) {
      await addReward(reward);
    }
  };

  const handleSave = async (reward: Reward) => {
    if (editing) {
      await updateReward(reward);
    } else {
      await addReward(reward);
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditing(reward);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditing(undefined);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(undefined);
  };

  const handleDelete = (id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward) return;
    if (!window.confirm(`确定要删除奖励「${reward.name}」吗？`)) return;
    deleteReward(id);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/parent"
          className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold">家庭奖励池</h2>
      </div>

      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">当前奖励数量</p>
          <p className="text-2xl font-bold">{rewards.length}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddDefault}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-200 active:scale-95"
          >
            <Gift className="h-4 w-4" />
            一键添加默认奖励
          </button>
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            新增奖励
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card border-2 border-indigo-200 bg-indigo-50/50">
          <h3 className="mb-4 text-lg font-bold">
            {editing ? '编辑奖励' : '新增奖励'}
          </h3>
          <RewardForm reward={editing} onSave={handleSave} onCancel={handleCloseForm} />
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="mb-3 text-4xl">🎁</div>
          <p className="text-slate-500">奖励池还是空的</p>
          <p className="mt-1 text-sm text-slate-400">点击上方按钮添加奖励，孩子可用星星兑换</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rewards.map(reward => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
