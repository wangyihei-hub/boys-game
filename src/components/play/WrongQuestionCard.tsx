import type { WrongQuestionDisplay } from '../../services/wrongLogic';

interface WrongQuestionCardProps {
  display: WrongQuestionDisplay;
  onReview: (questionId: string) => void;
}

const SUBJECT_LABELS: Record<WrongQuestionDisplay['subject'], string> = {
  chinese: '语文',
  math: '数学',
  english: '英语'
};

const SUBJECT_COLORS: Record<WrongQuestionDisplay['subject'], string> = {
  chinese: 'bg-green-100 text-green-700',
  math: 'bg-blue-100 text-blue-700',
  english: 'bg-yellow-100 text-yellow-700'
};

export function WrongQuestionCard({ display, onReview }: WrongQuestionCardProps) {
  const { subject, levelNumber, isBoss, questionText, answer, explanation, options, record } = display;
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <span className={['rounded-lg px-2 py-0.5 text-xs font-bold', SUBJECT_COLORS[subject]].join(' ')}>
          {SUBJECT_LABELS[subject]} · L{String(levelNumber).padStart(3, '0')} {isBoss ? 'Boss' : ''}
        </span>
        <span className="text-xs font-semibold text-red-500">
          答错 {record.wrongCount} 次
        </span>
      </div>

      <p className="font-medium text-slate-800">{questionText}</p>

      {options && options.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {options.map((option, index) => (
            <div
              key={index}
              className={[
                'rounded-lg border px-3 py-2 text-sm',
                index === answer
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              ].join(' ')}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      {explanation && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <span className="font-semibold">解析：</span>
          {explanation}
        </div>
      )}

      <button
        type="button"
        onClick={() => onReview(record.questionId)}
        className="btn-primary w-full"
      >
        去复习
      </button>
    </div>
  );
}
