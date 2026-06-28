import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Star, RotateCcw } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';
import { useEconomyStore } from '../stores/economyStore';
import { getTriviaQuestions, type TriviaQuestion } from '../services/triviaData';
import { playSound } from '../services/soundService';

const QUESTION_COUNT = 10;
const STARS_PER_CORRECT = 1;

export function Trivia() {
  const incrementMinigameStat = useProfileStore(state => state.incrementMinigameStat);
  const grantMinigameReward = useEconomyStore(state => state.grantMinigameReward);

  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const startGame = useCallback(() => {
    setQuestions(getTriviaQuestions(QUESTION_COUNT));
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setFinished(false);
    setShowResult(false);
    setRewarded(false);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (finished && !rewarded) {
      setRewarded(true);
      playSound('win');
      const stars = correctCount * STARS_PER_CORRECT;
      if (stars > 0) {
        grantMinigameReward({ type: 'stars', amount: stars });
      }
      incrementMinigameStat('triviaCorrect', correctCount);
    }
  }, [finished, rewarded, correctCount, grantMinigameReward, incrementMinigameStat]);

  const handleAnswer = (optionIndex: number) => {
    if (selected !== null || finished) return;
    setSelected(optionIndex);
    setShowResult(true);
    if (optionIndex === questions[index].correctIndex) {
      playSound('correct');
      setCorrectCount(c => c + 1);
    } else {
      playSound('wrong');
    }
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIndex(i => i + 1);
      setSelected(null);
      setShowResult(false);
    }
  };

  if (questions.length === 0) return null;

  const current = questions[index];
  const isCorrect = selected === current.correctIndex;

  return (
    <div className="scene-camp -mx-2 -mt-2 min-h-full rounded-t-3xl p-3 sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="glass-card flex items-center gap-3">
          <Link to="/play/arcade" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800">百科问答</h2>
            <p className="text-xs text-slate-500">答题涨知识</p>
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
            <div className="glass-card space-y-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>第 {index + 1} / {questions.length} 题</span>
                <span>已答对 {correctCount} 题</span>
              </div>
              <h3 className="text-lg font-bold leading-snug text-slate-800">{current.question}</h3>
              <div className="space-y-2">
                {current.options.map((option, idx) => {
                  const state =
                    selected === null
                      ? 'idle'
                      : idx === current.correctIndex
                        ? 'correct'
                        : idx === selected
                          ? 'wrong'
                          : 'disabled';
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selected !== null}
                      className={[
                        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition',
                        state === 'idle' && 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white active:scale-[0.99]',
                        state === 'correct' && 'border-green-300 bg-green-100 text-green-700',
                        state === 'wrong' && 'border-red-300 bg-red-100 text-red-700',
                        state === 'disabled' && 'border-slate-100 bg-slate-50 text-slate-400'
                      ].join(' ')}
                    >
                      {state === 'correct' && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                      {state === 'wrong' && <XCircle className="h-5 w-5 shrink-0" />}
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
              {showResult && (
                <div className={['rounded-xl p-3 text-sm', isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'].join(' ')}>
                  <p className="font-bold">{isCorrect ? '回答正确！' : '回答错误'}</p>
                  <p className="mt-1">{current.explanation}</p>
                  <button
                    onClick={handleNext}
                    className="btn-primary mt-3 w-full text-center text-sm"
                  >
                    {index + 1 >= questions.length ? '查看结果' : '下一题'}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="glass-card space-y-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-4xl">🎓</div>
            <h3 className="text-xl font-bold text-slate-800">挑战完成</h3>
            <p className="text-slate-600">
              你答对了 <span className="text-2xl font-bold text-indigo-600">{correctCount}</span> / {questions.length} 题
            </p>
            <div className="flex items-center justify-center gap-1 text-lg font-bold text-yellow-500">
              <Star className="h-5 w-5 fill-current" />
              <span>+{correctCount * STARS_PER_CORRECT} 星星</span>
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
