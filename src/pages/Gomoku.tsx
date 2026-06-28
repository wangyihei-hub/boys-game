import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Star, Trophy } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { useEconomyStore } from '../stores/economyStore';
import { createEmptyBoard, getWinner, applyMove, findBestMove, type GomokuCell, type GomokuWinner } from '../services/gomokuEngine';
import { playSound } from '../services/soundService';

const BOARD_SIZE = 15;
const REWARD_STARS_WIN = 5;
const REWARD_STARS_DRAW = 2;

export function Gomoku() {
  const incrementMinigameStat = useProfileStore(state => state.incrementMinigameStat);
  const grantMinigameReward = useEconomyStore(state => state.grantMinigameReward);

  const [board, setBoard] = useState<GomokuCell[][]>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<GomokuWinner>(0);
  const [rewarded, setRewarded] = useState(false);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [thinking, setThinking] = useState(false);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(1);
    setWinner(0);
    setRewarded(false);
    setLastMove(null);
    setThinking(false);
  }, []);

  useEffect(() => {
    if (currentPlayer === 2 && winner === 0) {
      setThinking(true);
      const timer = setTimeout(() => {
        const move = findBestMove(board, 2, 2);
        if (move) {
          const nextBoard = applyMove(board, move.row, move.col, 2);
          setBoard(nextBoard);
          setLastMove(move);
          const result = getWinner(nextBoard);
          if (result !== 0) {
            setWinner(result);
          } else {
            setCurrentPlayer(1);
          }
        }
        setThinking(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, winner, board]);

  useEffect(() => {
    if (winner !== 0 && !rewarded) {
      if (winner === 1 || winner === 'draw') playSound('win');
      setRewarded(true);
      if (winner === 1) {
        grantMinigameReward({ type: 'stars', amount: REWARD_STARS_WIN });
        incrementMinigameStat('gomokuWins');
      } else if (winner === 'draw') {
        grantMinigameReward({ type: 'stars', amount: REWARD_STARS_DRAW });
      }
    }
  }, [winner, rewarded, grantMinigameReward, incrementMinigameStat]);

  const handleCellClick = (row: number, col: number) => {
    if (winner !== 0 || board[row][col] !== 0 || currentPlayer !== 1 || thinking) return;
    playSound('click');
    const nextBoard = applyMove(board, row, col, 1);
    setBoard(nextBoard);
    setLastMove({ row, col });
    const result = getWinner(nextBoard);
    if (result !== 0) {
      setWinner(result);
    } else {
      setCurrentPlayer(2);
    }
  };

  const getStatusText = () => {
    if (winner === 1) return '你赢了！🎉';
    if (winner === 2) return '电脑赢了，再接再厉！';
    if (winner === 'draw') return '平局！';
    if (thinking) return '电脑思考中…';
    return '轮到你了（黑棋）';
  };

  return (
    <div className="scene-camp -mx-2 -mt-2 min-h-full rounded-t-3xl p-3 sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="glass-card flex items-center gap-3">
          <Link to="/play/arcade" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">休闲五子棋</h2>
            <p className="text-xs text-slate-500">人机对战，五子连珠</p>
          </div>
          <button
            onClick={resetGame}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition active:scale-95"
            aria-label="重新开始"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        <div className="glass-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold">你</span>
            <span className="text-sm font-semibold text-slate-700">黑棋</span>
          </div>
          <div className="rounded-xl bg-white/60 px-3 py-1 text-sm font-bold text-slate-700">
            {getStatusText()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">电脑</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 text-xs font-bold border-2 border-slate-300">AI</span>
          </div>
        </div>

        {winner !== 0 && (
          <div className="glass-card flex items-center justify-center gap-3 bg-amber-50/80 text-amber-700">
            <Trophy className="h-6 w-6" />
            <span className="text-lg font-bold">{getStatusText()}</span>
            {winner === 1 && (
              <span className="flex items-center gap-1 rounded-lg bg-yellow-100 px-2 py-1 text-sm font-bold text-yellow-700">
                <Star className="h-4 w-4 fill-current" />+{REWARD_STARS_WIN}
              </span>
            )}
            {winner === 'draw' && (
              <span className="flex items-center gap-1 rounded-lg bg-yellow-100 px-2 py-1 text-sm font-bold text-yellow-700">
                <Star className="h-4 w-4 fill-current" />+{REWARD_STARS_DRAW}
              </span>
            )}
          </div>
        )}

        <div className="glass-card overflow-auto p-2">
          <div
            className="relative mx-auto aspect-square w-full max-w-[min(100%,540px)] rounded-xl bg-[#e6c88d] p-[2%] shadow-inner"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent calc(100% / 14), rgba(0,0,0,0.15) calc(100% / 14), rgba(0,0,0,0.15) calc(100% / 14 + 1px)), repeating-linear-gradient(90deg, transparent, transparent calc(100% / 14), rgba(0,0,0,0.15) calc(100% / 14), rgba(0,0,0,0.15) calc(100% / 14 + 1px))'
            }}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isLast = lastMove?.row === r && lastMove?.col === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={winner !== 0 || cell !== 0 || currentPlayer !== 1 || thinking}
                    className="absolute flex items-center justify-center rounded-full transition focus:outline-none"
                    style={{
                      top: `calc(${r} * 100% / ${BOARD_SIZE - 1} - 3.2%)`,
                      left: `calc(${c} * 100% / ${BOARD_SIZE - 1} - 3.2%)`,
                      width: '6.4%',
                      height: '6.4%'
                    }}
                    aria-label={`第 ${r + 1} 行 第 ${c + 1} 列`}
                  >
                    {cell !== 0 && (
                      <span
                        className={[
                          'flex h-full w-full items-center justify-center rounded-full shadow-md',
                          cell === 1 ? 'bg-slate-800' : 'bg-white border border-slate-300',
                          isLast ? 'ring-2 ring-yellow-400' : ''
                        ].join(' ')}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">点击交叉点落子。先连成五子者获胜。</p>
      </div>
    </div>
  );
}
