import { useState } from 'react';
import type { DailyTask, TaskType } from '../../types';
import { TASK_TEMPLATES } from '../../services/dailyTaskLogic';

interface DailyTaskFormProps {
  task?: DailyTask;
  dateKey?: string;
  onSave: (task: DailyTask) => Promise<void>;
  onCancel: () => void;
}

const TYPE_LABELS: Record<TaskType, string> = {
  login: '登录',
  win_battle: '通关战斗',
  correct_answers: '累计答对',
  earn_stars: '获得星星'
};

export function DailyTaskForm({ task, dateKey = '', onSave, onCancel }: DailyTaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [type, setType] = useState<TaskType>(task?.type ?? 'win_battle');
  const [target, setTarget] = useState(task?.target ?? 1);
  const [rewardStars, setRewardStars] = useState(task?.rewardStars ?? 5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(task);

  const handleTypeChange = (nextType: TaskType) => {
    setType(nextType);
    const template = TASK_TEMPLATES.find(t => t.type === nextType);
    if (template) {
      setTitle(template.title);
      setTarget(template.target);
      setRewardStars(template.rewardStars);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('请输入任务名称');
      return;
    }
    if (target <= 0) {
      setError('目标次数至少为 1');
      return;
    }
    if (rewardStars < 0) {
      setError('奖励星星不能为负数');
      return;
    }

    const next: DailyTask = {
      id: task?.id ?? `${dateKey}-${type}-${Date.now()}`,
      title: title.trim(),
      type,
      target,
      rewardStars,
      completed: task?.completed ?? false,
      progress: task?.progress ?? 0,
      dateKey: task?.dateKey ?? dateKey
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
        <label htmlFor="task-type" className="block text-sm font-semibold text-slate-700">
          任务类型
        </label>
        <select
          id="task-type"
          value={type}
          onChange={e => handleTypeChange(e.target.value as TaskType)}
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
        <label htmlFor="task-title" className="block text-sm font-semibold text-slate-700">
          任务名称
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="例如：通关 1 场战斗"
          className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="task-target" className="block text-sm font-semibold text-slate-700">
            目标次数
          </label>
          <input
            id="task-target"
            type="number"
            min={1}
            value={target}
            onChange={e => setTarget(Math.max(1, parseInt(e.target.value, 10) || 0))}
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="task-reward" className="block text-sm font-semibold text-slate-700">
            奖励星星
          </label>
          <input
            id="task-reward"
            type="number"
            min={0}
            value={rewardStars}
            onChange={e => setRewardStars(Math.max(0, parseInt(e.target.value, 10) || 0))}
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
          {saving ? '保存中…' : isEditing ? '更新任务' : '添加任务'}
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
