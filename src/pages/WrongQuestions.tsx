import { useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { decrementWrongCount, getWrongQuestionDisplays, groupWrongDisplaysBySubject } from '../services/wrongLogic';
import { WrongQuestionCard } from '../components/play/WrongQuestionCard';
import { PageHeader } from '../components/play/PageHeader';
import type { WrongQuestionDisplay } from '../services/wrongLogic';
import type { V3Subject } from '../data/v3/types';

const SUBJECT_LABELS: Record<V3Subject | 'all', string> = {
  all: '全部',
  chinese: '语文',
  math: '数学',
  english: '英语'
};

export function WrongQuestions() {
  const [displays, setDisplays] = useState<WrongQuestionDisplay[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<'all' | V3Subject>('all');

  useEffect(() => {
    loadDisplays();
  }, []);

  async function loadDisplays() {
    const items = await getWrongQuestionDisplays();
    setDisplays(items);
    setLoaded(true);
  }

  async function handleReview(questionId: string) {
    await decrementWrongCount(questionId);
    await loadDisplays();
  }

  const grouped = useMemo(() => groupWrongDisplaysBySubject(displays), [displays]);
  const subjectsToShow: ('all' | V3Subject)[] = ['all', 'chinese', 'math', 'english'];

  return (
    <div className="pb-4">
      <PageHeader title="错题本" />
      <div className="space-y-4 p-4">
        {!loaded ? (
          <div className="card py-12 text-center text-slate-500">加载中…</div>
        ) : displays.length === 0 ? (
          <div className="card py-12 text-center">
            <div className="mb-3 text-4xl">🎉</div>
            <p className="text-slate-500">太棒了，暂时没有错题！</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {subjectsToShow.map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={[
                    'rounded-full px-3 py-1.5 text-sm font-bold transition',
                    filter === s
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'
                  ].join(' ')}
                >
                  {SUBJECT_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {(['chinese', 'math', 'english'] as V3Subject[])
                .filter(subject => filter === 'all' || filter === subject)
                .map(subject => {
                  const subjectEntries = grouped[subject] ?? [];
                  if (subjectEntries.length === 0) return null;
                  return (
                    <div key={subject}>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                        <BookOpen className="h-4 w-4" />
                        {SUBJECT_LABELS[subject]} · {subjectEntries.length} 题
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {subjectEntries.map(display => (
                          <WrongQuestionCard
                            key={display.record.questionId}
                            display={display}
                            onReview={handleReview}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
