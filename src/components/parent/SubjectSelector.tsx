import type { Subject } from '../../types';

interface SubjectOption {
  value: Subject;
  label: string;
  subtitle: string;
  icon: string;
  colors: {
    bg: string;
    border: string;
    ring: string;
    text: string;
    iconBg: string;
  };
}

const SUBJECTS: SubjectOption[] = [
  {
    value: 'chinese',
    label: '语文之森',
    subtitle: '字词 · 阅读 · 作文',
    icon: '🌲',
    colors: {
      bg: 'bg-chinese-100',
      border: 'border-chinese-500',
      ring: 'ring-chinese-500',
      text: 'text-chinese-700',
      iconBg: 'bg-chinese-500'
    }
  },
  {
    value: 'math',
    label: '数学迷宫',
    subtitle: '计算 · 图形 · 应用',
    icon: '🧮',
    colors: {
      bg: 'bg-math-100',
      border: 'border-math-500',
      ring: 'ring-math-500',
      text: 'text-math-700',
      iconBg: 'bg-math-500'
    }
  },
  {
    value: 'english',
    label: '英语海岸',
    subtitle: '单词 · 语法 · 听力',
    icon: '⚓',
    colors: {
      bg: 'bg-english-100',
      border: 'border-english-500',
      ring: 'ring-english-500',
      text: 'text-english-700',
      iconBg: 'bg-english-500'
    }
  }
];

interface SubjectSelectorProps {
  value: Subject | null;
  onChange: (subject: Subject) => void;
}

export function SubjectSelector({ value, onChange }: SubjectSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {SUBJECTS.map(subject => {
        const selected = value === subject.value;
        return (
          <button
            key={subject.value}
            type="button"
            onClick={() => onChange(subject.value)}
            className={[
              'relative flex flex-col items-center rounded-2xl border-2 p-4 text-center transition-all',
              subject.colors.bg,
              selected ? subject.colors.border : 'border-transparent',
              selected ? `ring-2 ${subject.colors.ring} ring-offset-2` : 'hover:scale-[1.02]'
            ].join(' ')}
            aria-pressed={selected}
          >
            <div
              className={[
                'mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white shadow-sm',
                subject.colors.iconBg
              ].join(' ')}
            >
              {subject.icon}
            </div>
            <span className={['text-base font-bold', subject.colors.text].join(' ')}>
              {subject.label}
            </span>
            <span className="mt-1 text-xs text-slate-600">{subject.subtitle}</span>
            {selected && (
              <span className="absolute right-2 top-2 text-lg">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
