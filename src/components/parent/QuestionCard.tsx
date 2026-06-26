import { useState } from 'react';
import type { Question, Subject } from '../../types';
import { ChevronDown, Trash2 } from 'lucide-react';

interface SubjectMeta {
  label: string;
  icon: string;
  badge: string;
  border: string;
  bg: string;
}

const SUBJECT_META: Record<Subject, SubjectMeta> = {
  chinese: {
    label: '语文',
    icon: '🌲',
    badge: 'bg-chinese-100 text-chinese-700',
    border: 'border-chinese-500',
    bg: 'bg-white'
  },
  math: {
    label: '数学',
    icon: '🧮',
    badge: 'bg-math-100 text-math-700',
    border: 'border-math-500',
    bg: 'bg-white'
  },
  english: {
    label: '英语',
    icon: '⚓',
    badge: 'bg-english-100 text-english-700',
    border: 'border-english-500',
    bg: 'bg-white'
  }
};

interface QuestionCardProps {
  question: Question;
  onDelete: (id: string) => void;
}

export function QuestionCard({ question, onDelete }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = SUBJECT_META[question.subject];

  return (
    <div className={['card overflow-hidden border-l-4', meta.border, meta.bg].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold', meta.badge].join(' ')}>
              <span>{meta.icon}</span>
              {meta.label}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(question.generatedAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800">{question.question}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-expanded={expanded}
            aria-label={expanded ? '收起详情' : '展开详情'}
          >
            <ChevronDown className={['h-5 w-5 transition-transform', expanded ? 'rotate-180' : ''].join(' ')} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(question.id)}
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
            aria-label="删除题目"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
          {question.options && question.options.length > 0 && (
            <div className="space-y-1">
              {question.options.map((option, index) => {
                const isCorrect = index === Number(question.answer);
                return (
                  <div
                    key={index}
                    className={[
                      'rounded-lg px-3 py-2',
                      isCorrect ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-700'
                    ].join(' ')}
                  >
                    <span className="font-bold">{String.fromCharCode(65 + index)}.</span> {option}
                    {isCorrect && <span className="ml-2 text-xs font-bold">（正确答案）</span>}
                  </div>
                );
              })}
            </div>
          )}

          {(!question.options || question.options.length === 0) && (
            <div className="rounded-lg bg-green-50 px-3 py-2 text-green-700">
              <span className="font-bold">答案：</span>
              {typeof question.answer === 'number' ? String(question.answer) : question.answer}
            </div>
          )}

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
            <span className="font-bold text-slate-500">解析：</span>
            {question.explanation}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span>类型：{question.type === 'choice' ? '选择题' : question.type === 'fillblank' ? '填空题' : '拼写题'}</span>
            <span>难度：{'★'.repeat(question.difficulty)}</span>
            <span>知识点：{question.topic}</span>
          </div>
        </div>
      )}
    </div>
  );
}
