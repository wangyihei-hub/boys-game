import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Database, Download, Upload } from 'lucide-react';
import { useParentStore } from '../../stores/parentStore';
import { useProfileStore } from '../../stores/profileStore';
import { useQuestionStore } from '../../stores/questionStore';
import {
  exportAllData,
  importAllData,
  downloadJson
} from '../../services/exportImportLogic';

export function DataExportImportCard() {
  const settings = useParentStore(state => state.settings);
  const verifyPin = useParentStore(state => state.verifyPin);
  const loadParentData = useParentStore(state => state.loadParentData);
  const loadProfile = useProfileStore(state => state.loadProfile);
  const loadQuestions = useQuestionStore(state => state.loadQuestions);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pin, setPin] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSuccess = (text: string) => {
    setMessage({ type: 'success', text });
    window.setTimeout(() => setMessage(null), 3000);
  };

  const showError = (text: string) => {
    setMessage({ type: 'error', text });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadJson(data, `boys-game-backup-${timestamp}.json`);
      showSuccess('全部数据已导出');
    } catch (err) {
      showError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setMessage(null);
  };

  const handleImport = async () => {
    if (!file) {
      showError('请先选择要导入的 JSON 备份文件');
      return;
    }

    if (settings?.pin && !verifyPin(pin)) {
      showError('PIN 不正确，无法导入');
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await importAllData(parsed);
      await Promise.all([loadParentData(), loadProfile(), loadQuestions()]);
      setFile(null);
      setPin('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showSuccess('数据导入成功，已恢复所有内容');
    } catch (err) {
      showError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
    }
  };

  if (!settings) {
    return (
      <div className="card">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold">数据备份</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">加载中...</p>
      </div>
    );
  }

  const pinRequired = Boolean(settings.pin);

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3">
        <Database className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-bold">数据备份</h2>
      </div>

      <p className="text-sm text-slate-500">
        将所有数据导出为 JSON 文件备份到本地，或从备份文件恢复。导入会完全覆盖当前数据，请谨慎操作。
      </p>

      <div className="space-y-3 rounded-xl border-2 border-indigo-100 bg-indigo-50/50 p-4">
        <h3 className="font-bold text-slate-800">导出全部数据</h3>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exporting ? '导出中...' : '导出全部数据'}
        </button>
      </div>

      <div className="space-y-4 rounded-xl border-2 border-amber-100 bg-amber-50/50 p-4">
        <h3 className="font-bold text-slate-800">导入数据</h3>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">选择备份文件</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-100 file:px-4 file:py-2 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-200"
          />
          {file && (
            <p className="text-xs text-slate-500">
              已选择：{file.name}
            </p>
          )}
        </div>

        {pinRequired && (
          <div className="space-y-1">
            <label htmlFor="import-pin" className="block text-sm font-semibold text-slate-700">
              家长 PIN
            </label>
            <input
              id="import-pin"
              type="password"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="请输入家长 PIN"
              className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleImport}
          disabled={importing || !file}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 font-semibold text-white shadow hover:bg-amber-700 active:scale-95 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {importing ? '导入中...' : '确认导入'}
        </button>
      </div>

      {message && (
        <div
          className={[
            'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold',
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          ].join(' ')}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}
