import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import type { BattleResult as BattleResultType } from '../types';

interface BattleResultState {
  result: BattleResultType;
  stars: number;
  exp: number;
  levelUps: number;
  newLevel: number;
  newExp: number;
  doubled?: boolean;
}

export function BattleResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const clearCurrentBattle = useGameStore(state => state.clearCurrentBattle);

  const state = location.state as BattleResultState | null;

  useEffect(() => {
    if (!state) {
      navigate('/play');
    }
    return () => {
      clearCurrentBattle();
    };
  }, [state, navigate, clearCurrentBattle]);

  if (!state) return null;

  const isWin = state.result === 'win';

  return (
    <div className="space-y-4">
      <div className="card text-center">
        <div className="mb-2 text-6xl">{isWin ? '🏆' : '💔'}</div>
        <h2 className="text-2xl font-bold">{isWin ? '战斗胜利！' : '战斗失败'}</h2>
        <p className="text-slate-500">
          {isWin ? '恭喜你击败了怪物！' : '不要气馁，再试一次吧！'}
        </p>
      </div>

      {isWin && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-yellow-50 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">+{state.stars}</p>
            <p className="text-sm font-semibold text-yellow-700">星星</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">+{state.exp}</p>
            <p className="text-sm font-semibold text-indigo-700">经验</p>
          </div>
        </div>
      )}

      {state.doubled && (
        <div className="card animate-bounceShort border-pink-300 bg-pink-50 text-center">
          <p className="text-2xl font-bold text-pink-600">幸运双倍！</p>
          <p className="text-sm font-semibold text-pink-700">宠物让你的星星奖励翻倍了</p>
        </div>
      )}

      {state.levelUps > 0 && (
        <div className="card animate-bounceShort border-amber-300 bg-amber-50 text-center">
          <p className="text-2xl font-bold text-amber-700">升级了！</p>
          <p className="text-lg font-semibold text-amber-800">
            当前等级：Lv.{state.newLevel}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate('/play')}
          className="btn-secondary flex-1"
        >
          返回营地
        </button>
        <button
          type="button"
          onClick={() => navigate('/play')}
          className="btn-primary flex-1"
        >
          回基地
        </button>
      </div>
    </div>
  );
}
