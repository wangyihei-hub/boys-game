import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Star, RotateCcw, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { useEconomyStore } from '../stores/economyStore';
import { generateSpeedMathProblem, formatSpeedMathProblem, calculateSpeedMathRank, getSpeedMathRankReward, type SpeedMathProblem, type SpeedMathRank } from '../services/speedMathEngine';
import { playSound } from '../services/soundService';

const TOTAL_QUESTIONS = 12;
const TIME_LIMIT_SECONDS = 120;

export function SpeedMath() {
  const incrementMinigameStat = useProfileStore(state => state.incrementMinigameStat);
  const grantMinigameReward = useEconomyStore(state => state.grantMinigameReward);

  const [problem, setProblem] = useState<SpeedMathProblem | null>(null);
  const [input, setInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [rank, setRank] = useState<SpeedMathRank | null>(null);
  const [rewarded, setRewarded] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const startGame = useCallback(() => {
    setProblem(generateSpeedMathProblem());
    setInput('');
    setQuestionIndex(0);
    setCorrectCount(0);
    setStartTime(Date.now());
    setElapsed(0);
    setFinished(false);
    setRank(null);
    setRewarded(false);
    setFeedback(null);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (startTime && !finished) {
      timerRef.current = window.setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        setElapsed(seconds);
        if (seconds >= TIME_LIMIT_SECONDS) {
          finishGame(correctCount, seconds);
        }
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [startTime, finished, correctCount]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [problem]);

  useEffect(() => {
    if (finished && !rewarded && rank) {
      setRewarded(true);
      playSound('win');
      const stars = getSpeedMathRankReward(rank);
      grantMinigameReward({ type: 'stars', amount: stars });
      if (rank === 'S') {
        incrementMinigameStat('speedMathSRankCount');
      }
    }
  }, [finished, rewarded, rank, grantMinigameReward, incrementMinigameStat]);

  const finishGame = (finalCorrect: number, finalSeconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const finalRank = calculateSpeedMathRank(finalCorrect, finalSeconds);
    setRank(finalRank);
    setFinished(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem || finished) return;

    const value = parseInt(input, 10);
    const isCorrect = value === problem.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    playSound(isCorrect ? 'correct' : 'wrong');
    const nextCorrect = isCorrect ? correctCount + 1 : correctCount;
    if (isCorrect) setCorrectCount(nextCorrect);

    setTimeout(() => {
      if (questionIndex + 1 >= TOTAL_QUESTIONS) {
        const seconds = Math.floor((Date.now() - (startTime ?? Date.now())) / 1000);
        finishGame(nextCorrect, seconds);
      } else {
        setProblem(generateSpeedMathProblem());
        setInput('');
        setQuestionIndex(i => i + 1);
        setFeedback(null);
      }
    }, 400);
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
            <h2 className="text-lg font-bold text-slate-800">速算挑战</h2>
            <p className="text-xs text-slate-500">限时心算</p>
          </div>
          <button
            onClick={startGame}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition active:scale-95"
            aria-label="重新开始"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        {!finished ? (
          <>
            <div className="glass-card flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>第 {questionIndex + 1} / {TOTAL_QUESTIONS} 题</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>{formatTime(Math.max(0, TIME_LIMIT_SECONDS - elapsed))}</span>
              </div>
            </div>

            <div className="glass-card space-y-4 text-center">
              <div className="text-4xl font-black text-slate-800">
                {problem ? formatSpeedMathProblem(problem) : ''}
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="输入答案"
                  className="w-full rounded-xl border-2 border-indigo-100 bg-white/70 px-4 py-3 text-center text-2xl font-bold text-slate-800 outline-none focus:border-indigo-400"
                />
                <button type="submit" className="btn-primary w-full text-sm">
                  提交
                </button>
              </form>
              {feedback && (
                <div className={['flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold', feedback === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'].join(' ')}>
                  {feedback === 'correct' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  {feedback === 'correct' ? '正确！' : '错误'}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="glass-card space-y-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-4xl">
              {rank === 'S' ? '🏆' : rank === 'A' ? '🥈' : rank === 'B' ? '🥉' : '👍'}
            </div>
            <h3 className="text-xl font-bold text-slate-800">评价：{rank}</h3>
            <p className="text-slate-600">
              答对 <span className="text-2xl font-bold text-indigo-600">{correctCount}</span> / {TOTAL_QUESTIONS} 题
            </p>
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-yellow-500">
              <Star className="h-5 w-5 fill-current" />
              <span>+{rank ? getSpeedMathRankReward(rank) : 0} 星星</span>
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
