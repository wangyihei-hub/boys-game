import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { decrementWrongCount, getWrongQuestionDisplays, groupWrongDisplaysBySubject } from '../services/wrongLogic';
import { WrongQuestionCard } from '../components/play/WrongQuestionCard';
import type { WrongQuestionDisplay } from '../services/wrongLogic';
import type { V3Subject } from '../data/v3/types';

const SUBJECT_LABELS: Record<V3Subject, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语'
};

export function WrongQuestions() {
  const [displays, setDisplays] = useState<WrongQuestionDisplay[]>([]);
  const [loaded, setLoaded] = useState(false);

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

  const grouped = groupWrongDisplaysBySubject(displays);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/play"
          className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-xl font-bold">错题本</h2>
      </div>

      {!loaded ? (
        <div className="card py-12 text-center text-slate-500">加载中…</div>
      ) : displays.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="mb-3 text-4xl">🎉</div>
          <p className="text-slate-500">太棒了，暂时没有错题！</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(['chinese', 'math', 'english'] as V3Subject[]).map(subject => {
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
      )}
    </div>
  );
}
