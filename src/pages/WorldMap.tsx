import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StageNode } from '../components/play/StageNode';
import { useGameStore, computeRegionProgress, getStagesBySubject } from '../stores/gameStore';
import { useQuestionStore } from '../stores/questionStore';
import { useProfileStore } from '../stores/profileStore';
import { useEconomyStore } from '../stores/economyStore';
import { computeEquipmentBonuses } from '../services/equipmentLogic';
import { useSwipe } from '../hooks/useSwipe';
import type { Stage, StageStatus, Subject } from '../types';
import { ChevronLeft } from 'lucide-react';

const REGIONS: { subject: Subject; name: string; emoji: string }[] = [
  { subject: 'chinese', name: '语文之森', emoji: '🌲' },
  { subject: 'math', name: '数学迷宫', emoji: '🧮' },
  { subject: 'english', name: '英语海岸', emoji: '⚓' }
];

const SUBJECT_ZONE: Record<Subject, string> = {
  chinese: 'map-zone-chinese',
  math: 'map-zone-math',
  english: 'map-zone-english'
};

const SUBJECT_PATH: Record<Subject, string> = {
  chinese: '#22c55e',
  math: '#3b82f6',
  english: '#eab308'
};

function getNodePosition(index: number, total: number): { left: string; top: string } {
  if (total <= 1) return { left: '50%', top: '50%' };
  const isLast = index === total - 1;
  const x = 8 + index * (84 / (total - 1));
  const y = isLast ? 45 : index % 2 === 0 ? 72 : 28;
  return { left: `${x}%`, top: `${y}%` };
}

function buildPathPoints(total: number): string {
  const points: string[] = [];
  for (let i = 0; i < total; i++) {
    const { left, top } = getNodePosition(i, total);
    const x = parseFloat(left);
    const y = parseFloat(top);
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }
  return points.join(' ');
}

export function WorldMap() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<Subject>('chinese');
  const scrollRef = useRef<HTMLDivElement>(null);

  const profile = useProfileStore(state => state.profile);
  const progress = useGameStore(state => state.progress);
  const loaded = useGameStore(state => state.loaded);
  const error = useGameStore(state => state.error);
  const loadProgress = useGameStore(state => state.loadProgress);
  const clearError = useGameStore(state => state.clearError);
  const startBattle = useGameStore(state => state.startBattle);
  const loadQuestions = useQuestionStore(state => state.loadQuestions);
  const getQuestionsForBattle = useQuestionStore(state => state.getQuestionsForBattle);
  const inventory = useEconomyStore(state => state.inventory);
  const loadInventory = useEconomyStore(state => state.loadInventory);

  useEffect(() => {
    loadProgress();
    loadQuestions();
    loadInventory();
  }, [loadProgress, loadQuestions, loadInventory]);

  const stages = useMemo(() => getStagesBySubject(selectedSubject), [selectedSubject]);

  const progressMap = useMemo(() => {
    const map = new Map<string, StageStatus>();
    for (const p of progress) {
      map.set(p.stageId, p.status);
    }
    return map;
  }, [progress]);

  const switchSubject = (direction: 'left' | 'right') => {
    const idx = REGIONS.findIndex(r => r.subject === selectedSubject);
    const nextIdx = direction === 'left'
      ? (idx - 1 + REGIONS.length) % REGIONS.length
      : (idx + 1) % REGIONS.length;
    setSelectedSubject(REGIONS[nextIdx].subject);
  };

  const swipeHandlers = useSwipe({
    threshold: 56,
    onSwipeLeft: () => switchSubject('right'),
    onSwipeRight: () => switchSubject('left')
  });

  const handleStageClick = (stage: Stage) => {
    if (!profile) return;
    const questions = getQuestionsForBattle(stage.subject, stage.difficulty, stage.questionCount);
    if (questions.length === 0) return;
    const bonuses = computeEquipmentBonuses(inventory, profile.equippedItems);
    startBattle(stage, questions, profile.level, bonuses);
    navigate(`/play/battle/${stage.subject}/${stage.id}`);
  };

  const regionProgress = useMemo(
    () => computeRegionProgress(progress, selectedSubject),
    [progress, selectedSubject]
  );

  const pathD = useMemo(() => buildPathPoints(stages.length), [stages.length]);
  const pathColor = SUBJECT_PATH[selectedSubject];

  if (!loaded) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">加载地图中…</div>
    );
  }

  return (
    <div className="space-y-3" {...swipeHandlers}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/play')}
          className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold sm:text-xl">世界地图</h2>
          <p className="text-xs text-slate-500">
            {regionProgress.passed}/{regionProgress.total} 关已通关
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-100 p-4 text-red-700">
          <p className="font-bold">加载失败</p>
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={() => { clearError(); loadProgress(); }}
            className="mt-2 text-sm font-semibold underline"
          >
            重试
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {REGIONS.map(region => {
          const active = region.subject === selectedSubject;
          const accent = region.subject === 'chinese'
            ? 'bg-chinese-100 text-chinese-700 border-chinese-500'
            : region.subject === 'math'
              ? 'bg-math-100 text-math-700 border-math-500'
              : 'bg-english-100 text-english-700 border-english-500';
          return (
            <button
              key={region.subject}
              type="button"
              onClick={() => setSelectedSubject(region.subject)}
              className={[
                'flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2 text-sm font-bold transition active:scale-95',
                active ? `${accent} border-2` : 'border-slate-200 bg-white text-slate-600'
              ].join(' ')}
            >
              <span className="text-xl">{region.emoji}</span>
              <span className="text-xs sm:text-sm">{region.name}</span>
            </button>
          );
        })}
      </div>

      <div
        ref={scrollRef}
        className="relative overflow-x-auto rounded-3xl pb-2 touch-pan-x"
        onTouchStart={e => e.stopPropagation()}
      >
        <div className={`map-track ${SUBJECT_ZONE[selectedSubject]}`}>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d={pathD}
              fill="none"
              stroke={pathColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 4"
              className="animate-pathFlow"
              opacity="0.6"
            />
            <path
              d={pathD}
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="2 2"
              opacity="0.5"
            />
          </svg>

          {stages.map(stage => {
            const pos = getNodePosition(stage.stageNumber - 1, stages.length);
            return (
              <div
                key={stage.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: pos.left, top: pos.top }}
              >
                <StageNode
                  stage={stage}
                  status={progressMap.get(stage.id) ?? 'locked'}
                  onClick={() => handleStageClick(stage)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        左右滑动可切换学科区域
      </p>
    </div>
  );
}
