import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { useEconomyStore } from '../stores/economyStore';
import { useProfileStore } from '../stores/profileStore';
import { RewardItem } from '../components/play/RewardItem';
import { PageHeader } from '../components/play/PageHeader';
import type { Reward } from '../types';

export function RewardShop() {
  const navigate = useNavigate();
  const profile = useProfileStore(state => state.profile);
  const rewards = useEconomyStore(state => state.rewards);
  const loadEconomyData = useEconomyStore(state => state.loadEconomyData);
  const requestRedemption = useEconomyStore(state => state.requestRedemption);
  const loaded = useEconomyStore(state => state.loaded);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadEconomyData();
  }, [loadEconomyData]);

  if (!profile) return null;

  const handleRedeem = async (reward: Reward) => {
    if (processingId) return;
    const confirmed = window.confirm(`确定花费 ${reward.starCost} 颗星星兑换「${reward.name}」吗？\n兑换后需要家长确认才能兑现。`);
    if (!confirmed) return;

    setProcessingId(reward.id);
    try {
      const result = await requestRedemption(reward.id);
      if (result.success) {
        navigate('/play');
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="pb-4">
      <PageHeader title="奖励兑换" />
      <div className="space-y-4 p-4">
        <div className="card flex items-center gap-3 bg-pink-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">奖励兑换</h2>
            <p className="text-xs text-slate-500">用星星兑换家长设置的奖励</p>
          </div>
        </div>

        {!loaded ? (
          <div className="card py-12 text-center text-slate-500">加载奖励中…</div>
        ) : rewards.length === 0 ? (
          <div className="card py-12 text-center">
            <div className="mb-3 text-4xl">🎁</div>
            <p className="text-slate-500">奖励池还是空的</p>
            <p className="mt-1 text-sm text-slate-400">请让家长先去添加奖励</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rewards.map(reward => (
              <RewardItem
                key={reward.id}
                reward={reward}
                canAfford={profile.stars >= reward.starCost}
                onRedeem={handleRedeem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
