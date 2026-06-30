import { useEffect, useState } from 'react';
import { Ticket } from 'lucide-react';
import { useEconomyStore } from '../stores/economyStore';
import { useProfileStore } from '../stores/profileStore';
import { LotteryWheel } from '../components/play/LotteryWheel';
import { PageHeader } from '../components/play/PageHeader';
import { getInventoryCount } from '../services/lotteryLogic';

export function Lottery() {
  const profile = useProfileStore(state => state.profile);
  const inventory = useEconomyStore(state => state.inventory);
  const lotteryPool = useEconomyStore(state => state.lotteryPool);
  const loadEconomyData = useEconomyStore(state => state.loadEconomyData);
  const buyLotteryTicket = useEconomyStore(state => state.buyLotteryTicket);
  const drawLottery = useEconomyStore(state => state.drawLottery);
  const loaded = useEconomyStore(state => state.loaded);

  const [spinning, setSpinning] = useState(false);
  const [lastPrize, setLastPrize] = useState<{ name: string; icon: string; type: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEconomyData();
  }, [loadEconomyData]);

  const ticketCount = getInventoryCount(inventory, 'lottery_ticket');

  const handleBuyTicket = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      await buyLotteryTicket();
    } finally {
      setProcessing(false);
    }
  };

  const handleDraw = async () => {
    if (processing || ticketCount <= 0) return;
    setProcessing(true);
    setSpinning(true);
    setLastPrize(null);
    try {
      // Short animation delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      const result = await drawLottery();
      if (result.success && result.prize) {
        setLastPrize(result.prize);
      }
    } finally {
      setSpinning(false);
      setProcessing(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="pb-4">
      <PageHeader title="周末抽奖" />
      <div className="space-y-4 p-4">
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">周末抽奖</h2>
              <p className="text-xs text-slate-500">现有奖券 {ticketCount} 张</p>
            </div>
          </div>
        </div>

        {!loaded ? (
          <div className="card py-12 text-center text-slate-500">加载中…</div>
        ) : (
          <>
            <LotteryWheel prize={lastPrize} spinning={spinning} />

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleBuyTicket}
                disabled={processing || profile.stars < 10}
                className="btn-secondary disabled:opacity-60"
              >
                {processing && ticketCount === 0 ? '购买中…' : '10 星星买券'}
              </button>
              <button
                type="button"
                onClick={handleDraw}
                disabled={processing || ticketCount <= 0}
                className="btn-primary disabled:opacity-60"
              >
                {spinning ? '抽奖中…' : ticketCount > 0 ? '抽一次' : '无券可抽'}
              </button>
            </div>

            {lotteryPool.length > 0 && (
              <div className="card">
                <h3 className="mb-3 text-sm font-bold text-slate-700">当前奖池</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {lotteryPool.map(prize => (
                    <div
                      key={prize.id}
                      className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="text-xl">{prize.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-700">{prize.name}</p>
                        <p className="text-xs text-slate-500">{(prize.probability * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
