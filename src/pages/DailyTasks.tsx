import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useParentStore } from '../stores/parentStore';
import { useProfileStore } from '../stores/profileStore';
import { DailyTaskItem } from '../components/play/DailyTaskItem';
import { PageHeader } from '../components/play/PageHeader';
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
    <div className="pb-4">
      <PageHeader title="每日任务" />
      <div className="space-y-4 p-4">
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">今日任务</h2>
              <p className="text-xs text-slate-500">
                完成 {completedCount}/{dailyTasks.length} 个任务
              </p>
            </div>
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
    </div>
  );
}
