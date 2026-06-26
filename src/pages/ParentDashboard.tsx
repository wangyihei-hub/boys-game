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

      <ApiSettingsCard settings={settings} onSave={updateSettings} />
    </div>
  );
}
