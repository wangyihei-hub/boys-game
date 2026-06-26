import { useEffect, useState } from 'react';
import type { AIProvider, ParentSettings } from '../../types';

interface ApiSettingsCardProps {
  settings: ParentSettings;
  onSave: (settings: ParentSettings) => Promise<void>;
}

const PROVIDER_DEFAULTS: Record<AIProvider, { endpoint: string; model: string }> = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini'
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307'
  },
  custom: {
    endpoint: '',
    model: ''
  }
};

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  custom: '自定义'
};

export function ApiSettingsCard({ settings, onSave }: ApiSettingsCardProps) {
  const [provider, setProvider] = useState<AIProvider>(settings.apiProvider ?? 'openai');
  const [apiKey, setApiKey] = useState(settings.apiKey ?? '');
  const [endpoint, setEndpoint] = useState(settings.apiEndpoint ?? '');
  const [model, setModel] = useState(settings.apiModel ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const clearFeedback = () => {
    setSaved(false);
    if (saveError) setSaveError(null);
  };

  useEffect(() => {
    setProvider(settings.apiProvider ?? 'openai');
    setApiKey(settings.apiKey ?? '');
    setEndpoint(settings.apiEndpoint ?? '');
    setModel(settings.apiModel ?? '');
    setSaved(false);
    setSaveError(null);
  }, [settings.apiProvider, settings.apiKey, settings.apiEndpoint, settings.apiModel]);

  const persist = async (patch: Partial<ParentSettings>) => {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      await onSave({ ...settings, ...patch });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as AIProvider;
    setProvider(next);
    setEndpoint('');
    setModel('');
    clearFeedback();
    // Persist immediately with cleared endpoint/model so stale custom values
    // are not sent to OpenAI/Anthropic on the next generation.
    await persist({
      apiProvider: next,
      apiEndpoint: undefined,
      apiModel: undefined
    });
  };

  const handleSave = async () => {
    await persist({
      apiProvider: provider,
      apiKey: apiKey.trim(),
      apiEndpoint: endpoint.trim() || undefined,
      apiModel: model.trim() || undefined
    });
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-bold">AI 出题设置</h2>

      <div className="space-y-1">
        <label htmlFor="api-provider" className="block text-sm font-semibold text-slate-700">
          服务提供商
        </label>
        <select
          id="api-provider"
          value={provider}
          onChange={handleProviderChange}
          className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
        >
          <option value="openai">{PROVIDER_LABELS.openai}</option>
          <option value="anthropic">{PROVIDER_LABELS.anthropic}</option>
          <option value="custom">{PROVIDER_LABELS.custom}</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="api-key" className="block text-sm font-semibold text-slate-700">
          API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={e => {
            setApiKey(e.target.value);
            clearFeedback();
          }}
          placeholder={provider === 'custom' ? '可选' : '请输入 API Key'}
          className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
        />
        <p className="text-xs text-slate-500">密钥仅在本地浏览器中使用，不会上传到服务器。</p>
      </div>

      {provider === 'custom' && (
        <div className="space-y-1">
          <label htmlFor="api-endpoint" className="block text-sm font-semibold text-slate-700">
            API Endpoint
          </label>
          <input
            id="api-endpoint"
            type="url"
            value={endpoint}
            onChange={e => {
              setEndpoint(e.target.value);
              clearFeedback();
            }}
            placeholder="https://api.example.com/v1/chat/completions"
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="api-model" className="block text-sm font-semibold text-slate-700">
          模型
        </label>
        <input
          id="api-model"
          type="text"
          value={model}
          onChange={e => {
            setModel(e.target.value);
            clearFeedback();
          }}
          placeholder={provider === 'custom' ? '请输入模型名称' : PROVIDER_DEFAULTS[provider].model}
          className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary disabled:opacity-60"
        >
          {saving ? '保存中...' : '保存'}
        </button>
        {saved && !saveError && <span className="text-sm font-semibold text-green-600">已保存</span>}
        {saveError && <span className="text-sm font-semibold text-red-600">{saveError}</span>}
      </div>
    </div>
  );
}
