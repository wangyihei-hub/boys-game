import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BookOpen, Sparkles, Gift, ClipboardList, Settings } from 'lucide-react';
import { ApiSettingsCard } from '../components/parent/ApiSettingsCard';
import { useParentStore } from '../stores/parentStore';
import { useProfileStore } from '../stores/profileStore';

export function ParentDashboard() {
  const settings = useParentStore(state => state.settings);
  const updateSettings = useParentStore(state => state.updateSettings);
  const dailyStats = useProfileStore(state => state.dailyStats);
  const loadDailyStats = useProfileStore(state => state.loadDailyStats);

  useEffect(() => {
    loadDailyStats();
  }, [loadDailyStats]);

  if (!settings) return null;

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="mb-2 text-lg font-bold">基础设置</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500">每日星星上限</p>
            <p className="text-xl font-bold">{settings.dailyStarLimit}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">每日时长上限（分钟）</p>
            <p className="text-xl font-bold">{settings.dailyMinuteLimit}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center gap-3">
          <Activity className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold">今日使用概览</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">今日星星收入</p>
            <p className="text-xl font-bold">
              {dailyStats?.starsEarned ?? 0} / {settings.dailyStarLimit}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">今日游戏时长</p>
            <p className="text-xl font-bold">
              {dailyStats?.minutesPlayed ?? 0} / {settings.dailyMinuteLimit} 分钟
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">最近一次活动</p>
            <p className="text-xl font-bold">
              {dailyStats && dailyStats.lastActivityAt > 0
                ? new Date(dailyStats.lastActivityAt).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '暂无'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/parent/questions"
          className="card flex items-center gap-4 transition hover:bg-indigo-50 active:scale-95"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold">题库管理</h3>
            <p className="text-sm text-slate-500">查看、管理和删除已生成的题目</p>
          </div>
        </Link>

        <Link
          to="/parent/questions/generate"
          className="card flex items-center gap-4 transition hover:bg-indigo-50 active:scale-95"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold">AI 出题</h3>
            <p className="text-sm text-slate-500">使用 AI 自动生成各学科练习题</p>
          </div>
        </Link>

        <Link
          to="/parent/rewards"
          className="card flex items-center gap-4 transition hover:bg-pink-50 active:scale-95"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
            <Gift className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold">奖励池管理</h3>
            <p className="text-sm text-slate-500">配置家庭奖励、星星价格和库存</p>
          </div>
        </Link>

        <Link
          to="/parent/redemptions"
          className="card flex items-center gap-4 transition hover:bg-green-50 active:scale-95"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600">
            <ClipboardList className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold">兑换审批</h3>
            <p className="text-sm text-slate-500">确认或拒绝孩子的星星兑换申请</p>
          </div>
        </Link>

        <Link
          to="/parent/settings"
          className="card flex items-center gap-4 transition hover:bg-purple-50 active:scale-95"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <Settings className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold">游戏配置</h3>
            <p className="text-sm text-slate-500">每日任务与抽奖奖池管理</p>
          </div>
        </Link>
      </div>

      <ApiSettingsCard settings={settings} onSave={updateSettings} />
    </div>
  );
}
