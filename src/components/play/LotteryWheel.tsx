import { useEffect, useState } from 'react';

interface LotteryWheelProps {
  prize?: { name: string; icon: string; type: string } | null;
  spinning: boolean;
}

export function LotteryWheel({ prize, spinning }: LotteryWheelProps) {
  const [showSparkle, setShowSparkle] = useState(false);

  useEffect(() => {
    if (prize && !spinning) {
      setShowSparkle(true);
      const timer = setTimeout(() => setShowSparkle(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [prize, spinning]);

  return (
    <div className="card flex flex-col items-center gap-4 py-8 text-center">
      <div
        className={[
          'flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br text-6xl shadow-lg',
          spinning
            ? 'from-indigo-300 to-purple-400 animate-spin'
            : prize
              ? 'from-amber-200 to-orange-300'
              : 'from-slate-200 to-slate-300'
        ].join(' ')}
      >
        {spinning ? '✨' : prize ? prize.icon : '🎁'}
      </div>

      {spinning ? (
        <p className="text-lg font-bold text-indigo-600">抽奖中…</p>
      ) : prize ? (
        <div className="space-y-1">
          <p className="text-xl font-bold text-amber-700">{prize.name}</p>
          {showSparkle && <p className="text-sm text-amber-600">🎉 恭喜获得！</p>}
        </div>
      ) : (
        <p className="text-slate-500">点击按钮开始抽奖</p>
      )}
    </div>
  );
}
