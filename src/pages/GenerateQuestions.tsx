import { useState } from 'react';
import type { Difficulty, Subject } from '../types';
import { SubjectSelector } from '../components/parent/SubjectSelector';
import { GenerateForm } from '../components/parent/GenerateForm';
import { GenerationStatus } from '../components/parent/GenerationStatus';
import { useParentStore } from '../stores/parentStore';

const GRADES = [4, 5] as const;

export function GenerateQuestions() {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [grade, setGrade] = useState<4 | 5>(4);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [count, setCount] = useState(5);

  const generating = useParentStore(state => state.generating);
  const error = useParentStore(state => state.error);
  const lastResult = useParentStore(state => state.lastResult);
  const generateQuestions = useParentStore(state => state.generateQuestions);
  const clearError = useParentStore(state => state.clearError);
  const clearGenerationResult = useParentStore(state => state.clearGenerationResult);

  const canGenerate = subject && topic.trim();

  const handleGenerate = async () => {
    if (!subject || !topic.trim()) return;
    await generateQuestions({
      subject,
      topic: topic.trim(),
      difficulty,
      count,
      grade
    });
  };

  const handleSubjectChange = (value: Subject | null) => {
    setSubject(value);
    clearGenerationResult();
  };

  const handleGradeChange = (value: 4 | 5) => {
    setGrade(value);
    clearGenerationResult();
  };

  const handleTopicChange = (value: string) => {
    setTopic(value);
    clearGenerationResult();
  };

  const handleDifficultyChange = (value: Difficulty) => {
    setDifficulty(value);
    clearGenerationResult();
  };

  const handleCountChange = (value: number) => {
    setCount(value);
    clearGenerationResult();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card">
        <h2 className="mb-1 text-lg font-bold">选择学科</h2>
        <p className="mb-4 text-sm text-slate-500">点击卡片选择要出题的学科</p>
        <SubjectSelector value={subject} onChange={handleSubjectChange} />
      </div>

      <div className="card space-y-3">
        <h2 className="text-lg font-bold">年级</h2>
        <div className="grid grid-cols-2 gap-2">
          {GRADES.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => handleGradeChange(g)}
              className={[
                'rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors',
                grade === g
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
              ].join(' ')}
              aria-pressed={grade === g}
            >
              {g} 年级
            </button>
          ))}
        </div>
      </div>

      <GenerateForm
        topic={topic}
        onTopicChange={handleTopicChange}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        count={count}
        onCountChange={handleCountChange}
      />

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate || generating}
        className="btn-primary w-full disabled:opacity-60"
      >
        {generating ? '生成中…' : '开始 AI 出题'}
      </button>

      <GenerationStatus
        generating={generating}
        error={error}
        result={lastResult}
        onClearError={clearError}
      />
    </div>
  );
}
