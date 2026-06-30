import { Check } from 'lucide-react';
import type { Subject } from '../../types';

const SUBJECT_META: Record<Subject, { label: string; color: string; ring: string; bg: string }> = {
  chinese: { label: '语文', color: 'text-emerald-700', ring: 'ring-emerald-500', bg: 'bg-emerald-500' },
  math: { label: '数学', color: 'text-blue-700', ring: 'ring-blue-500', bg: 'bg-blue-500' },
  english: { label: '英语', color: 'text-amber-700', ring: 'ring-amber-500', bg: 'bg-amber-500' }
};

interface ChapterNodeProps {
  subject: Subject;
  status: 'passed' | 'current' | 'locked';
}

export function ChapterNode({ subject, status }: ChapterNodeProps) {
  const meta = SUBJECT_META[subject];
  if (status === 'locked') {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 ring-4 ring-slate-100">
        <span className="text-xl">🔒</span>
      </div>
    );
  }
  if (status === 'passed') {
    return (
      <div className={['flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md', meta.bg].join(' ')}>
        <Check className="h-7 w-7" />
      </div>
    );
  }
  return (
    <div className={['flex h-14 w-14 animate-pulseGlow items-center justify-center rounded-full bg-white shadow-lg ring-4', meta.ring].join(' ')}>
      <span className={['text-sm font-bold', meta.color].join(' ')}>{meta.label}</span>
    </div>
  );
}
