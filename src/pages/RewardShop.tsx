import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useEconomyStore } from '../stores/economyStore';
import { useProfileStore } from '../stores/profileStore';
import { RewardItem } from '../components/play/RewardItem';
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
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/play"
          className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold">奖励兑换</h2>
        <div className="ml-auto flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-yellow-600 shadow-sm">
          <Star className="h-4 w-4 fill-current" />
          <span className="font-bold">{profile.stars}</span>
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
  );
}
