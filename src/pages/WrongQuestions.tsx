import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { deleteWrongQuestion, getWrongQuestions, saveWrongQuestion } from '../db';
import { useQuestionStore } from '../stores/questionStore';
import { WrongQuestionCard } from '../components/play/WrongQuestionCard';
import type { Question, WrongQuestion } from '../types';

export function WrongQuestions() {
  const questions = useQuestionStore(state => state.questions);
  const loadQuestions = useQuestionStore(state => state.loadQuestions);
  const loaded = useQuestionStore(state => state.loaded);

  const [wrongRecords, setWrongRecords] = useState<WrongQuestion[]>([]);
  const [recordsLoaded, setRecordsLoaded] = useState(false);

  useEffect(() => {
    loadQuestions();
    loadWrongRecords();
  }, [loadQuestions]);

  async function loadWrongRecords() {
    const records = await getWrongQuestions();
    setWrongRecords(records);
    setRecordsLoaded(true);
  }

  async function handleReview(question: Question) {
    const record = wrongRecords.find(r => r.questionId === question.id);
    if (!record) return;

    const nextCount = record.wrongCount - 1;
    if (nextCount <= 0) {
      await deleteWrongQuestion(question.id);
    } else {
      await saveWrongQuestion({ ...record, wrongCount: nextCount, lastReviewAt: Date.now() });
    }
    await loadWrongRecords();
  }

  const questionMap = new Map(questions.map(q => [q.id, q]));
  const entries = wrongRecords
    .map(record => ({ record, question: questionMap.get(record.questionId) }))
    .filter((entry): entry is { record: WrongQuestion; question: Question } => entry.question !== undefined)
    .sort((a, b) => b.record.wrongCount - a.record.wrongCount);

  const grouped = entries.reduce((acc, entry) => {
    const subject = entry.question.subject;
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(entry);
    return acc;
  }, {} as Record<Question['subject'], typeof entries>);

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

      {!loaded || !recordsLoaded ? (
        <div className="card py-12 text-center text-slate-500">加载中…</div>
      ) : entries.length === 0 ? (
        <div className="card py-12 text-center">
          <div className="mb-3 text-4xl">🎉</div>
          <p className="text-slate-500">太棒了，暂时没有错题！</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(['chinese', 'math', 'english'] as const).map(subject => {
            const subjectEntries = grouped[subject] ?? [];
            if (subjectEntries.length === 0) return null;
            const labels = { chinese: '语文', math: '数学', english: '英语' };
            return (
              <div key={subject}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <BookOpen className="h-4 w-4" />
                  {labels[subject]} · {subjectEntries.length} 题
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {subjectEntries.map(({ record, question }) => (
                    <WrongQuestionCard
                      key={question.id}
                      question={question}
                      wrongRecord={record}
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
