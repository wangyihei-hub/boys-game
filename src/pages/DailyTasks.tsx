import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useParentStore } from '../stores/parentStore';
import { useProfileStore } from '../stores/profileStore';
import { DailyTaskItem } from '../components/play/DailyTaskItem';
import type { DailyTask } from '../types';

export function DailyTasks() {
  const profile = useProfileStore(state => state.profile);
  const dailyTasks = useParentStore(state => state.dailyTasks);
  const loadParentData = useParentStore(state => state.loadParentData);
  const claimDailyTaskReward = useParentStore(state => state.claimDailyTaskReward);
  const loaded = useParentStore(state => state.loaded);

  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  const handleClaim = async (task: DailyTask) => {
    if (claimingId) return;
    setClaimingId(task.id);
    try {
      await claimDailyTaskReward(task.id);
    } finally {
      setClaimingId(null);
    }
  };

  const completedCount = dailyTasks.filter(t => t.completed).length;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/play"
          className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold">每日任务</h2>
          <p className="text-xs text-slate-500">
            完成 {completedCount}/{dailyTasks.length} 个任务
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-slate-600 shadow-sm">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-bold">今日</span>
        </div>
      </div>

      {!loaded || !profile ? (
        <div className="card py-12 text-center text-slate-500">加载任务中…</div>
      ) : dailyTasks.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="mb-3 text-4xl">📝</div>
          <p className="text-slate-500">今日暂无任务</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {dailyTasks.map(task => (
            <DailyTaskItem
              key={task.id}
              task={task}
              onClaim={handleClaim}
              claimingId={claimingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
