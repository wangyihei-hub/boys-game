import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, RotateCcw, Clock } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { useEconomyStore } from '../stores/economyStore';
import { createMemoryDeck, calculateMemoryRank, getRankReward, type MemoryCard, type MemoryRank } from '../services/memoryGameEngine';
import { playSound } from '../services/soundService';

const PAIR_COUNT = 8;

export function Memory() {
  const incrementMinigameStat = useProfileStore(state => state.incrementMinigameStat);
  const grantMinigameReward = useEconomyStore(state => state.grantMinigameReward);

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [rank, setRank] = useState<MemoryRank | null>(null);
  const [rewarded, setRewarded] = useState(false);
  const timerRef = useRef<number | null>(null);

  const startGame = useCallback(() => {
    setCards(createMemoryDeck(PAIR_COUNT));
    setFlipped([]);
    setMoves(0);
    setStartTime(Date.now());
    setElapsed(0);
    setFinished(false);
    setRank(null);
    setRewarded(false);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (startTime && !finished) {
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [startTime, finished]);

  useEffect(() => {
    if (finished && !rewarded && rank) {
      setRewarded(true);
      playSound('win');
      const stars = getRankReward(rank);
      grantMinigameReward({ type: 'stars', amount: stars });
      if (rank === 'S') {
        incrementMinigameStat('memorySRankCount');
      }
    }
  }, [finished, rewarded, rank, grantMinigameReward, incrementMinigameStat]);

  const handleCardClick = (index: number) => {
    if (finished || cards[index].isMatched || cards[index].isFlipped || flipped.length >= 2) return;
    playSound('click');

    const nextCards = [...cards];
    nextCards[index].isFlipped = true;
    setCards(nextCards);
    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = nextFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        setTimeout(() => {
          playSound('correct');
          let allMatched = false;
          setCards(prev => {
            const updated = [...prev];
            updated[first].isMatched = true;
            updated[second].isMatched = true;
            allMatched = updated.every(c => c.isMatched);
            return updated;
          });
          setFlipped([]);
          if (allMatched) {
            const finalRank = calculateMemoryRank(moves + 1, PAIR_COUNT, elapsed);
            setRank(finalRank);
            setFinished(true);
          }
        }, 400);
      } else {
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[first].isFlipped = false;
            updated[second].isFlipped = false;
            return updated;
          });
          setFlipped([]);
        }, 800);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="scene-camp -mx-2 -mt-2 min-h-full rounded-t-3xl p-3 sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="glass-card flex items-center gap-3">
          <Link to="/play/arcade" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">记忆翻牌</h2>
            <p className="text-xs text-slate-500">找出所有相同卡片</p>
          </div>
          <button
            onClick={startGame}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition active:scale-95"
            aria-label="重新开始"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        <div className="glass-card flex items-center justify-between text-sm font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>{formatTime(elapsed)}</span>
          </div>
          <span>步数：{moves}</span>
        </div>

        <div className="glass-card">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                disabled={card.isMatched || card.isFlipped || flipped.length >= 2}
                className={[
                  'relative aspect-square rounded-xl text-3xl transition-all duration-300',
                  card.isFlipped || card.isMatched
                    ? 'bg-white shadow-md'
                    : 'bg-indigo-100 text-indigo-300 hover:bg-indigo-200 active:scale-95',
                  card.isMatched && 'opacity-60'
                ].join(' ')}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  {card.isFlipped || card.isMatched ? card.emoji : '?'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {finished && rank && (
          <div className="glass-card space-y-3 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-4xl">
              {rank === 'S' ? '🏆' : rank === 'A' ? '🥈' : rank === 'B' ? '🥉' : '👍'}
            </div>
            <h3 className="text-xl font-bold text-slate-800">评价：{rank}</h3>
            <p className="text-slate-600">用时 {formatTime(elapsed)}，{moves} 步</p>
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-yellow-500">
              <Star className="h-5 w-5 fill-current" />
              <span>+{getRankReward(rank)} 星星</span>
            </div>
            <button onClick={startGame} className="btn-primary w-full text-sm">
              再玩一次
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
