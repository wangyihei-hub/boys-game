import { useState } from 'react';
import type { GenerationResult } from '../../types';

interface GenerationStatusProps {
  generating: boolean;
  error: string | null;
  result: GenerationResult | null;
  onClearError: () => void;
}

export function GenerationStatus({ generating, error, result, onClearError }: GenerationStatusProps) {
  const [rawExpanded, setRawExpanded] = useState(false);

  if (generating) {
    return (
      <div className="card flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="font-semibold text-slate-700">AI 正在出题，请稍候…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card space-y-3 border-red-200 bg-red-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-red-700">生成失败</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            type="button"
            onClick={onClearError}
            className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
          >
            清除
          </button>
        </div>
        {result?.rawResponse && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setRawExpanded(v => !v)}
              className="text-sm font-semibold text-red-700 underline underline-offset-2"
            >
              {rawExpanded ? '隐藏原始响应' : '查看原始响应（调试用）'}
            </button>
            {rawExpanded && (
              <pre className="max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-slate-700 shadow-inner">
                {result.rawResponse}
              </pre>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-slate-800">生成结果</p>
        <span className="text-xs text-slate-500">{result.durationMs} ms</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-green-50 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{result.success}</p>
          <p className="text-xs text-green-600">成功入库</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{result.failed}</p>
          <p className="text-xs text-amber-600">解析失败</p>
        </div>
      </div>
      {result.rawResponse && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setRawExpanded(v => !v)}
            className="text-sm font-semibold text-indigo-600 underline underline-offset-2"
          >
            {rawExpanded ? '隐藏原始响应' : '查看原始响应（调试用）'}
          </button>
          {rawExpanded && (
            <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              {result.rawResponse}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
