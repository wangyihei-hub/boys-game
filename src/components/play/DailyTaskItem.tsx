import { Star, Check } from 'lucide-react';
import type { DailyTask } from '../../types';

interface DailyTaskItemProps {
  task: DailyTask;
  onClaim: (task: DailyTask) => void;
  claimingId?: string | null;
}

export function DailyTaskItem({ task, onClaim, claimingId }: DailyTaskItemProps) {
  const canClaim = task.completed && task.rewardStars > 0;
  const progressPercent = Math.min(100, Math.round((task.progress / task.target) * 100));

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-800">{task.title}</h3>
          <p className="text-xs text-slate-500">
            进度 {task.progress}/{task.target}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-700">
          <Star className="h-3 w-3 fill-current" />
          {task.rewardStars}
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => onClaim(task)}
        disabled={!canClaim || claimingId === task.id}
        className={[
          'w-full rounded-xl px-4 py-2 text-sm font-semibold shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
          canClaim
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-slate-200 text-slate-500'
        ].join(' ')}
      >
        {claimingId === task.id ? (
          '领取中…'
        ) : task.rewardStars === 0 ? (
          <span className="flex items-center justify-center gap-1">
            <Check className="h-4 w-4" /> 已领取
          </span>
        ) : task.completed ? (
          '领取奖励'
        ) : (
          '进行中'
        )}
      </button>
    </div>
  );
}
