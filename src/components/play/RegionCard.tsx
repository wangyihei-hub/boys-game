import type { Subject } from '../../types';

interface RegionCardProps {
  subject: Subject;
  name: string;
  emoji: string;
  description: string;
  passed: number;
  total: number;
  isSelected: boolean;
  onClick: () => void;
}

const SUBJECT_ACCENT: Record<Subject, { bg: string; border: string; text: string }> = {
  chinese: { bg: 'bg-chinese-100', border: 'border-chinese-500', text: 'text-chinese-700' },
  math: { bg: 'bg-math-100', border: 'border-math-500', text: 'text-math-700' },
  english: { bg: 'bg-english-100', border: 'border-english-500', text: 'text-english-700' }
};

export function RegionCard({
  subject,
  name,
  emoji,
  description,
  passed,
  total,
  isSelected,
  onClick
}: RegionCardProps) {
  const accent = SUBJECT_ACCENT[subject];
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'card flex w-full items-center gap-4 text-left transition',
        isSelected ? `border-4 ${accent.border}` : 'border-2 border-slate-200',
        isSelected ? accent.bg : 'bg-white',
        'hover:scale-[1.02] active:scale-95'
      ].join(' ')}
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm">
        {emoji}
      </div>
      <div className="flex-1">
        <h3 className={['text-lg font-bold', accent.text].join(' ')}>{name}</h3>
        <p className="text-sm text-slate-500">{description}</p>
        <p className="mt-1 text-xs font-semibold text-slate-600">
          已通过 {passed}/{total} 关
        </p>
      </div>
    </button>
  );
}
