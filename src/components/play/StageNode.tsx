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

export function StageNode({ stage, status, onClick }: StageNodeProps) {
  const isLocked = status === 'locked';
  const isPassed = status === 'passed';

  return (
    <button
      type="button"
      disabled={isLocked}
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-2 transition',
        isLocked ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 active:scale-95'
      ].join(' ')}
    >
      <div
        className={[
          'flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow',
          isPassed ? 'bg-green-500 text-white' : 'bg-white',
          isLocked ? 'ring-2 ring-slate-300' : `ring-4 ${SUBJECT_RING[stage.subject]}`,
          stage.isBoss ? 'h-18 w-18 text-3xl' : ''
        ].join(' ')}
      >
        {isLocked ? '🔒' : isPassed ? '⭐' : stage.isBoss ? '👹' : '⚔️'}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700">
          {stage.isBoss ? 'BOSS' : `${stage.stageNumber}`}
        </p>
        <p className="max-w-[80px] text-xs text-slate-500">{stage.name}</p>
      </div>
    </button>
  );
}
