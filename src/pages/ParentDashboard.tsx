import { Link } from 'react-router-dom';
import { BookOpen, Sparkles } from 'lucide-react';
import { ApiSettingsCard } from '../components/parent/ApiSettingsCard';
import { useParentStore } from '../stores/parentStore';

export function ParentDashboard() {
  const settings = useParentStore(state => state.settings);
  const updateSettings = useParentStore(state => state.updateSettings);

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
      </div>

      <ApiSettingsCard settings={settings} onSave={updateSettings} />
    </div>
  );
}
