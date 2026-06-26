import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import type { ParentSettings } from '../../types';

interface HealthSettingsCardProps {
  settings: ParentSettings;
  onSave: (settings: ParentSettings) => Promise<void>;
}

interface SettingMeta {
  key: keyof Pick<
    ParentSettings,
    'dailyStarLimit' | 'dailyMinuteLimit' | 'eyeCareIntervalMinutes' | 'restModeStartHour'
  >;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const SETTINGS_META: SettingMeta[] = [
  {
    key: 'dailyStarLimit',
    label: '每日星星上限',
    unit: '颗',
    min: 0,
    max: 300,
    step: 5
  },
  {
    key: 'dailyMinuteLimit',
    label: '每日时长上限',
    unit: '分钟',
    min: 0,
    max: 240,
    step: 5
  },
  {
    key: 'eyeCareIntervalMinutes',
    label: '护眼提醒间隔',
    unit: '分钟',
    min: 5,
    max: 60,
    step: 5
  },
  {
    key: 'restModeStartHour',
    label: '休息模式开始时间',
    unit: '点',
    min: 18,
    max: 23,
    step: 1
  }
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function HealthSettingsCard({ settings, onSave }: HealthSettingsCardProps) {
  const [values, setValues] = useState(settings);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setValues(settings);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const persist = (next: ParentSettings) => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        await onSave(next);
      } finally {
        setSaving(false);
      }
    }, 400);
  };

  const handleChange = (key: SettingMeta['key'], rawValue: number) => {
    const meta = SETTINGS_META.find(m => m.key === key)!;
    const value = clamp(rawValue, meta.min, meta.max);
    const next = { ...values, [key]: value };
    setValues(next);
    persist(next as ParentSettings);
  };

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 text-rose-500" />
          <h2 className="text-lg font-bold">健康使用设置</h2>
        </div>
        {saving && <span className="text-xs font-semibold text-slate-400">保存中...</span>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {SETTINGS_META.map(meta => (
          <div key={meta.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor={meta.key} className="text-sm font-semibold text-slate-700">
                {meta.label}
              </label>
              <div className="flex items-center gap-1">
                <input
                  id={`${meta.key}-number`}
                  type="number"
                  inputMode="numeric"
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  value={values[meta.key]}
                  onChange={e => handleChange(meta.key, Number(e.target.value))}
                  className="w-16 rounded-lg border-2 border-slate-200 px-2 py-1 text-center text-sm font-bold outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-500">{meta.unit}</span>
              </div>
            </div>
            <input
              id={meta.key}
              type="range"
              min={meta.min}
              max={meta.max}
              step={meta.step}
              value={values[meta.key]}
              onChange={e => handleChange(meta.key, Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{meta.min}</span>
              <span>{meta.max}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        调整后将自动保存到本地。达到上限后孩子会收到温馨提醒。
      </p>
    </div>
  );
}
