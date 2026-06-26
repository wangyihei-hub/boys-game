import { useState, useEffect } from 'react';
import type { Question } from '../../types';

interface BattleQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  timeLimitMs: number;
  onAnswer: (answer: string | number) => void;
  disabled?: boolean;
}

export function BattleQuestion({
  question,
  questionNumber,
  totalQuestions,
  timeLimitMs,
  onAnswer,
  disabled
}: BattleQuestionProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimitMs);
  const [selected, setSelected] = useState<string | number | null>(null);

  useEffect(() => {
    setTimeLeft(timeLimitMs);
    setSelected(null);
  }, [question.id, timeLimitMs]);

  useEffect(() => {
    if (disabled || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 100;
        if (next <= 0) {
          clearInterval(interval);
          onAnswer('');
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [disabled, timeLeft, onAnswer]);

  const handleSelect = (value: string | number) => {
    if (disabled || selected !== null) return;
    setSelected(value);
    onAnswer(value);
  };

  const progressPercent = Math.max(0, Math.min(100, Math.round((timeLeft / timeLimitMs) * 100)));

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500">
          第 {questionNumber}/{totalQuestions} 题
        </span>
        <span className="text-sm font-bold text-indigo-600">
          {Math.ceil(timeLeft / 1000)}s
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div>
        <p className="text-lg font-bold text-slate-800">{question.question}</p>
        {question.type === 'choice' && question.options && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {question.options.map((option, index) => (
              <button
                key={index}
                type="button"
                disabled={disabled || selected !== null}
                onClick={() => handleSelect(index)}
                className={[
                  'rounded-xl border-2 px-4 py-3 text-left font-semibold transition',
                  selected === index
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300',
                  'disabled:cursor-not-allowed disabled:opacity-60'
                ].join(' ')}
              >
                {String.fromCharCode(65 + index)}. {option}
              </button>
            ))}
          </div>
        )}
        {question.type !== 'choice' && (
          <div className="mt-4 space-y-2">
            <input
              type="text"
              disabled={disabled || selected !== null}
              placeholder="请输入答案"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSelect(e.currentTarget.value.trim());
                }
              }}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              disabled={disabled || selected !== null}
              onClick={() => {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) handleSelect(input.value.trim());
              }}
              className="btn-primary w-full disabled:opacity-60"
            >
              提交答案
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
