import { useEffect, useMemo, useState } from 'react';
import { useQuestionStore } from '../stores/questionStore';
import { QuestionCard } from '../components/parent/QuestionCard';
import type { Question, Subject } from '../types';
import { Trash2, BookOpen } from 'lucide-react';

interface SubjectGroup {
  subject: Subject;
  label: string;
  icon: string;
  accent: string;
  questions: Question[];
}

const SUBJECT_GROUPS: Omit<SubjectGroup, 'questions'>[] = [
  { subject: 'chinese', label: '语文之森', icon: '🌲', accent: 'border-chinese-500 bg-chinese-100 text-chinese-700' },
  { subject: 'math', label: '数学迷宫', icon: '🧮', accent: 'border-math-500 bg-math-100 text-math-700' },
  { subject: 'english', label: '英语海岸', icon: '⚓', accent: 'border-english-500 bg-english-100 text-english-700' }
];

export function QuestionBank() {
  const questions = useQuestionStore(state => state.questions);
  const loaded = useQuestionStore(state => state.loaded);
  const error = useQuestionStore(state => state.error);
  const loadQuestions = useQuestionStore(state => state.loadQuestions);
  const deleteQuestions = useQuestionStore(state => state.deleteQuestions);
  const clearError = useQuestionStore(state => state.clearError);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const grouped = useMemo(() => {
    const bySubject: Record<Subject, Question[]> = {
      chinese: [],
      math: [],
      english: []
    };
    for (const q of questions) {
      bySubject[q.subject].push(q);
    }
    return SUBJECT_GROUPS.map(g => ({
      ...g,
      questions: bySubject[g.subject]
    }));
  }, [questions]);

  const totalCount = questions.length;
  const selectedCount = selectedIds.size;

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    await deleteQuestions(ids);
    setSelectedIds(prev => {
      const next = new Set(prev);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
  };

  if (!loaded) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <span>加载题库中…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">题库管理</h2>
          <p className="text-sm text-slate-500">共 {totalCount} 道题目</p>
        </div>
        {selectedCount > 0 && (
          <button
            type="button"
            onClick={() => handleDelete(Array.from(selectedIds))}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-600 active:scale-95"
          >
            <Trash2 className="h-4 w-4" />
            删除选中 ({selectedCount})
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-100 p-4 text-red-700">
          <p className="font-bold">加载失败</p>
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={() => { clearError(); loadQuestions(); }}
            className="mt-2 text-sm font-semibold underline"
          >
            重试
          </button>
        </div>
      )}

      {totalCount === 0 && !error && (
        <div className="card flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            <BookOpen className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500">题库还是空的</p>
          <p className="text-sm text-slate-400">去 AI 出题页面生成一些题目吧</p>
        </div>
      )}

      {grouped.map(group => (
        <section key={group.subject}>
          <div className={['mb-3 flex items-center gap-2 rounded-xl border-l-4 px-3 py-2', group.accent].join(' ')}>
            <span className="text-xl">{group.icon}</span>
            <span className="font-bold">{group.label}</span>
            <span className="ml-auto text-sm font-semibold opacity-80">{group.questions.length} 题</span>
          </div>

          {group.questions.length === 0 ? (
            <p className="px-3 text-sm text-slate-400">暂无{group.label}题目</p>
          ) : (
            <div className="space-y-3">
              {group.questions.map(question => (
                <div key={question.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(question.id)}
                    onChange={() => handleToggleSelect(question.id)}
                    className="mt-5 h-5 w-5 cursor-pointer accent-indigo-600"
                    aria-label={`选择题目 ${question.question}`}
                  />
                  <div className="flex-1">
                    <QuestionCard
                      question={question}
                      onDelete={(id) => handleDelete([id])}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
