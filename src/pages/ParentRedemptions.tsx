import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useEconomyStore } from '../stores/economyStore';
import { useParentStore } from '../stores/parentStore';
import type { RedemptionStatus } from '../types';

type Tab = 'pending' | 'confirmed' | 'rejected';

const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'confirmed', label: '已确认' },
  { key: 'rejected', label: '已拒绝' }
];

const STATUS_ICONS: Record<RedemptionStatus, React.ReactNode> = {
  pending: <Clock className="h-5 w-5 text-amber-500" />,
  confirmed: <CheckCircle className="h-5 w-5 text-green-500" />,
  rejected: <XCircle className="h-5 w-5 text-red-500" />
};

export function ParentRedemptions() {
  const redemptions = useEconomyStore(state => state.redemptions);
  const confirmRedemption = useParentStore(state => state.confirmRedemption);
  const rejectRedemption = useEconomyStore(state => state.rejectRedemption);
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filtered = redemptions.filter(r => r.status === activeTab).sort((a, b) => b.createdAt - a.createdAt);

  const handleConfirm = async (id: string) => {
    setProcessingId(id);
    try {
      await confirmRedemption(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('确定要拒绝该兑换并退还星星吗？')) return;
    setProcessingId(id);
    try {
      await rejectRedemption(id);
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (ts: number) => new Date(ts).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/parent"
          className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold">兑换审批</h2>
      </div>

      <div className="flex gap-2 rounded-xl bg-white p-1 shadow-sm">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
              activeTab === tab.key
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            ].join(' ')}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-80">
              ({redemptions.filter(r => r.status === tab.key).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="mb-3 text-4xl">📋</div>
          <p className="text-slate-500">暂无{activeTab === 'pending' ? '待处理' : activeTab === 'confirmed' ? '已确认' : '已拒绝'}的兑换</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(redemption => (
            <div key={redemption.id} className="card flex items-start gap-3">
              <div className="mt-0.5">{STATUS_ICONS[redemption.status]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{redemption.rewardName}</h3>
                  <span className="font-semibold text-yellow-600">{redemption.starCost} 星星</span>
                </div>
                <p className="text-sm text-slate-500">
                  申请时间：{formatTime(redemption.createdAt)}
                  {redemption.confirmedAt && ` · 确认时间：${formatTime(redemption.confirmedAt)}`}
                  {redemption.rejectedAt && ` · 拒绝时间：${formatTime(redemption.rejectedAt)}`}
                </p>
              </div>
              {redemption.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfirm(redemption.id)}
                    disabled={processingId === redemption.id}
                    className="inline-flex items-center gap-1 rounded-xl bg-green-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-green-600 active:scale-95 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    确认
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(redemption.id)}
                    disabled={processingId === redemption.id}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-red-600 active:scale-95 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    拒绝
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
