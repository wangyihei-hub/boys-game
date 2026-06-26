import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegionCard } from '../components/play/RegionCard';
import { StageNode } from '../components/play/StageNode';
import { useGameStore, computeRegionProgress, getStagesBySubject } from '../stores/gameStore';
import { useQuestionStore } from '../stores/questionStore';
import { useProfileStore } from '../stores/profileStore';
import type { Stage, StageStatus, Subject } from '../types';
import { ChevronLeft } from 'lucide-react';

const REGIONS: { subject: Subject; name: string; emoji: string; description: string }[] = [
  { subject: 'chinese', name: '语文之森', emoji: '🌲', description: '字词、成语、古诗与阅读' },
  { subject: 'math', name: '数学迷宫', emoji: '🧮', description: '四则运算、方程与应用题' },
  { subject: 'english', name: '英语海岸', emoji: '⚓', description: '单词、语法与情景对话' }
];

export function WorldMap() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<Subject>('chinese');

  const profile = useProfileStore(state => state.profile);
  const progress = useGameStore(state => state.progress);
  const loaded = useGameStore(state => state.loaded);
  const error = useGameStore(state => state.error);
  const loadProgress = useGameStore(state => state.loadProgress);
  const clearError = useGameStore(state => state.clearError);
  const startBattle = useGameStore(state => state.startBattle);
  const loadQuestions = useQuestionStore(state => state.loadQuestions);
  const getQuestionsForBattle = useQuestionStore(state => state.getQuestionsForBattle);

  useEffect(() => {
    loadProgress();
    loadQuestions();
  }, [loadProgress, loadQuestions]);

  const stages = useMemo(() => getStagesBySubject(selectedSubject), [selectedSubject]);

  const progressMap = useMemo(() => {
    const map = new Map<string, StageStatus>();
    for (const p of progress) {
      map.set(p.stageId, p.status);
    }
    return map;
  }, [progress]);

  const handleStageClick = (stage: Stage) => {
    if (!profile) return;
    const questions = getQuestionsForBattle(stage.subject, stage.difficulty, stage.questionCount);
    if (questions.length === 0) return;
    startBattle(stage, questions, profile.level);
    navigate(`/play/battle/${stage.subject}/${stage.id}`);
  };

  if (!loaded) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">加载地图中…</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/play')}
          className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold">世界地图</h2>
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

      <div className="space-y-3">
        {REGIONS.map(region => {
          const regionProgress = computeRegionProgress(progress, region.subject);
          return (
            <RegionCard
              key={region.subject}
              subject={region.subject}
              name={region.name}
              emoji={region.emoji}
              description={region.description}
              passed={regionProgress.passed}
              total={regionProgress.total}
              isSelected={selectedSubject === region.subject}
              onClick={() => setSelectedSubject(region.subject)}
            />
          );
        })}
      </div>

      <div className="card">
        <h3 className="mb-4 text-lg font-bold">
          {REGIONS.find(r => r.subject === selectedSubject)?.name} 关卡
        </h3>
        <div className="flex flex-wrap justify-center gap-6">
          {stages.map(stage => (
            <StageNode
              key={stage.id}
              stage={stage}
              status={progressMap.get(stage.id) ?? 'locked'}
              onClick={() => handleStageClick(stage)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
