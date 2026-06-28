import type { Stage, StageStatus } from '../../types';

interface StageNodeProps {
  stage: Stage;
  status: StageStatus;
  onClick: () => void;
}

const SUBJECT_RING: Record<Stage['subject'], string> = {
  chinese: 'ring-chinese-500',
  math: 'ring-math-500',
  english: 'ring-english-500'
};

const SUBJECT_BG: Record<Stage['subject'], string> = {
  chinese: 'bg-chinese-100',
  math: 'bg-math-100',
  english: 'bg-english-100'
};

export function StageNode({ stage, status, onClick }: StageNodeProps) {
  const isLocked = status === 'locked';
  const isPassed = status === 'passed';
  const isBoss = stage.isBoss;

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={onClick}
      className={[
        'group flex flex-col items-center gap-2 transition',
        isLocked ? 'cursor-not-allowed opacity-50' : 'hover:scale-110 active:scale-95'
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center justify-center rounded-full text-2xl shadow-lg transition',
          isBoss ? 'h-20 w-20 text-4xl' : 'h-16 w-16',
          isPassed
            ? 'bg-green-500 text-white ring-4 ring-green-300'
            : isLocked
              ? 'bg-slate-200 text-slate-400 ring-2 ring-slate-300'
              : `${SUBJECT_BG[stage.subject]} text-slate-700 ring-4 ${SUBJECT_RING[stage.subject]}`,
          !isLocked && !isPassed ? 'animate-pulseGlow' : ''
        ].join(' ')}
      >
        {isLocked ? '🔒' : isPassed ? '⭐' : isBoss ? '👹' : '⚔️'}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700 drop-shadow-sm">
          {isBoss ? 'BOSS' : `${stage.stageNumber}`}
        </p>
        <p className="max-w-[96px] text-xs font-semibold text-slate-600 drop-shadow-sm">
          {stage.name}
        </p>
      </div>
    </button>
  );
}
