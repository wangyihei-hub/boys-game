import type { Question, WrongQuestion } from '../../types';

interface WrongQuestionCardProps {
  question: Question;
  wrongRecord: WrongQuestion;
  onReview: (question: Question) => void;
}

const SUBJECT_LABELS: Record<Question['subject'], string> = {
  chinese: '语文',
  math: '数学',
  english: '英语'
};

const SUBJECT_COLORS: Record<Question['subject'], string> = {
  chinese: 'bg-green-100 text-green-700',
  math: 'bg-blue-100 text-blue-700',
  english: 'bg-yellow-100 text-yellow-700'
};

export function WrongQuestionCard({ question, wrongRecord, onReview }: WrongQuestionCardProps) {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <span className={['rounded-lg px-2 py-0.5 text-xs font-bold', SUBJECT_COLORS[question.subject]].join(' ')}>
          {SUBJECT_LABELS[question.subject]}
        </span>
        <span className="text-xs font-semibold text-red-500">
          答错 {wrongRecord.wrongCount} 次
        </span>
      </div>

      <p className="font-medium text-slate-800">{question.question}</p>

      {question.options && question.options.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={[
                'rounded-lg border px-3 py-2 text-sm',
                index === question.answer
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              ].join(' ')}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <span className="font-semibold">解析：</span>
        {question.explanation}
      </div>

      <button
        type="button"
        onClick={() => onReview(question)}
        className="btn-primary w-full"
      >
        去复习
      </button>
    </div>
  );
}
