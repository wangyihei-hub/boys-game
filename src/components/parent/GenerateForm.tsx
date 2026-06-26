import type { Difficulty } from '../../types';

interface GenerateFormProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  count: number;
  onCountChange: (count: number) => void;
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 1, label: '基础' },
  { value: 2, label: '进阶' },
  { value: 3, label: '挑战' }
];

export function GenerateForm({
  topic,
  onTopicChange,
  difficulty,
  onDifficultyChange,
  count,
  onCountChange
}: GenerateFormProps) {
  return (
    <div className="card space-y-5">
      <div className="space-y-2">
        <label htmlFor="topic" className="block text-sm font-semibold text-slate-700">
          出题主题
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={e => onTopicChange(e.target.value)}
          placeholder="例如：四年级上册第一单元、分数加减法、动物单词..."
          className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
        />
        <p className="text-xs text-slate-500">输入一个知识点或主题，AI 会围绕它出题。</p>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-semibold text-slate-700">难度</span>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTY_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => onDifficultyChange(option.value)}
              className={[
                'rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors',
                difficulty === option.value
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
              ].join(' ')}
              aria-pressed={difficulty === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="count" className="text-sm font-semibold text-slate-700">
            题目数量
          </label>
          <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-sm font-bold text-indigo-700">
            {count} 题
          </span>
        </div>
        <input
          id="count"
          type="range"
          min={1}
          max={20}
          step={1}
          value={count}
          onChange={e => onCountChange(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>1</span>
          <span>20</span>
        </div>
      </div>
    </div>
  );
}
