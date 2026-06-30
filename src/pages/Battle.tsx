import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MonsterAvatar } from '../components/play/MonsterAvatar';
import { HeroAvatar } from '../components/play/HeroAvatar';
import { BattleQuestion } from '../components/play/BattleQuestion';
import { ComboIndicator } from '../components/play/ComboIndicator';
import type { BattleAnswer, Question, Subject } from '../types';
import { useGameStore } from '../stores/gameStore';
import { useProfileStore } from '../stores/profileStore';
import { useEconomyStore } from '../stores/economyStore';
import { getAnswerTimeLimitMs, getHintOption, getExcludedOption } from '../services/battleLogic';
import { computeEquipmentBonuses } from '../services/equipmentLogic';
import { getPetInstance, computePetSkillEffect } from '../services/petLogic';
import type { PetSkillEffect } from '../services/petLogic';
import { buildBattleQuestions } from '../services/v3BattleQuestions';
import { assertV3Level } from '../data/v3';

interface FloatingText {
  id: number;
  value: string;
  side: 'hero' | 'monster';
  offsetX: number;
}

const SCENE_CLASS: Record<Subject, string> = {
  chinese: 'scene-chinese',
  math: 'scene-math',
  english: 'scene-english'
};

const SUBJECT_LABEL: Record<Subject, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语'
};

function isSubject(value: string): value is Subject {
  return value === 'chinese' || value === 'math' || value === 'english';
}

export function Battle() {
  const { subject: subjectParam, levelNumber: levelNumberParam } = useParams<{
    subject: string;
    levelNumber: string;
  }>();
  const navigate = useNavigate();

  const profile = useProfileStore(state => state.profile);
  const applyBattleRewards = useProfileStore(state => state.applyBattleRewards);
  const checkBattleAchievements = useProfileStore(state => state.checkBattleAchievements);
  const consumeStaminaForLevel = useProfileStore(state => state.consumeStaminaForLevel);
  const refreshStaminaNow = useProfileStore(state => state.refreshStaminaNow);
  const currentBattle = useGameStore(state => state.currentBattle);
  const startBattle = useGameStore(state => state.startBattle);
  const submitAnswer = useGameStore(state => state.submitAnswer);
  const finishBattle = useGameStore(state => state.finishBattle);
  const clearCurrentBattle = useGameStore(state => state.clearCurrentBattle);
  const submitTimeout = useGameStore(state => state.submitTimeout);
  const inventory = useEconomyStore(state => state.inventory);
  const loadInventory = useEconomyStore(state => state.loadInventory);

  const [monsterShake, setMonsterShake] = useState(false);
  const [heroBounce, setHeroBounce] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [hintOption, setHintOption] = useState<number | undefined>(undefined);
  const [heroAttacking, setHeroAttacking] = useState(false);
  const [monsterAttacking, setMonsterAttacking] = useState(false);
  const [heroHurt, setHeroHurt] = useState(false);
  const [monsterHurt, setMonsterHurt] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const floatIdRef = useMemo(() => ({ current: 0 }), []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Initialize battle: validate params, refresh stamina, consume stamina, build questions.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!subjectParam || !isSubject(subjectParam)) {
        navigate('/play');
        return;
      }
      const levelNumber = parseInt(levelNumberParam ?? '', 10);
      if (Number.isNaN(levelNumber) || levelNumber < 1 || levelNumber > 100) {
        navigate('/play');
        return;
      }

      // Already in a battle for the same level? Keep it.
      if (currentBattle?.subject === subjectParam && currentBattle.levelNumber === levelNumber) {
        return;
      }

      // Clear any stale battle.
      clearCurrentBattle();

      await refreshStaminaNow();
      const check = await consumeStaminaForLevel();
      if (!check.ok) {
        setLoadError(check.reason === 'daily_limit' ? '今日已通过 10 关，明天再来吧！' : '体力不足，稍等一会恢复后再挑战！');
        return;
      }

      let questions: Question[];
      try {
        questions = buildBattleQuestions(subjectParam, levelNumber);
      } catch {
        navigate('/play');
        return;
      }

      if (cancelled) return;
      startBattle(subjectParam, levelNumber, questions);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [subjectParam, levelNumberParam, navigate, currentBattle, clearCurrentBattle, refreshStaminaNow, consumeStaminaForLevel, startBattle]);

  useEffect(() => {
    setHintOption(undefined);
  }, [currentBattle?.currentIndex]);

  const addFloatingText = (value: string, side: 'hero' | 'monster') => {
    const id = ++floatIdRef.current;
    const offsetX = Math.round((Math.random() - 0.5) * 40);
    setFloatingTexts(prev => [...prev, { id, value, side, offsetX }]);
    window.setTimeout(() => {
      setFloatingTexts(prev => prev.filter(f => f.id !== id));
    }, 800);
  };

  // Attack / hurt animations on answer submission.
  useEffect(() => {
    if (!currentBattle || currentBattle.answers.length === 0) return;

    const lastAnswer = currentBattle.answers[currentBattle.answers.length - 1];
    let heroTimer: number | undefined;
    let monsterTimer: number | undefined;
    let attackTimer: number | undefined;
    let mAttackTimer: number | undefined;

    if (lastAnswer.correct) {
      setMonsterShake(true);
      setHeroAttacking(true);
      setMonsterHurt(true);
      addFloatingText('命中！', 'monster');
      monsterTimer = window.setTimeout(() => setMonsterShake(false), 400);
      attackTimer = window.setTimeout(() => {
        setHeroAttacking(false);
        setMonsterHurt(false);
      }, 400);
    } else {
      setHeroBounce(true);
      setMonsterAttacking(true);
      setHeroHurt(true);
      addFloatingText('失误', 'hero');
      heroTimer = window.setTimeout(() => setHeroBounce(false), 400);
      mAttackTimer = window.setTimeout(() => {
        setMonsterAttacking(false);
        setHeroHurt(false);
      }, 400);
    }

    return () => {
      if (heroTimer !== undefined) window.clearTimeout(heroTimer);
      if (monsterTimer !== undefined) window.clearTimeout(monsterTimer);
      if (attackTimer !== undefined) window.clearTimeout(attackTimer);
      if (mAttackTimer !== undefined) window.clearTimeout(mAttackTimer);
    };
  }, [currentBattle?.answers.length]);

  if (loadError) {
    return (
      <div className="space-y-4">
        <div className="card text-center">
          <div className="mb-2 text-5xl">⚡</div>
          <h2 className="text-xl font-bold">无法开始战斗</h2>
          <p className="text-slate-500">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/play')}
          className="btn-primary w-full"
        >
          返回营地
        </button>
      </div>
    );
  }

  if (!currentBattle || !profile || !subjectParam || !isSubject(subjectParam)) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">加载战斗中…</div>
    );
  }

  const subject = subjectParam;
  const bonuses = computeEquipmentBonuses(inventory, profile.equippedItems);

  const petInstance = getPetInstance(inventory, profile.activePet);
  const petEffect: PetSkillEffect | undefined = useMemo(
    () => (petInstance ? computePetSkillEffect(petInstance) : undefined),
    [petInstance?.item.id, petInstance?.item.evolutionStage, petInstance?.def.id]
  );

  const currentQuestion = currentBattle.questions[currentBattle.currentIndex];

  const excludedOption = useMemo(() => {
    if (petEffect?.skill !== 'exclude' || !currentQuestion.options) return undefined;
    return getExcludedOption(currentQuestion, petEffect);
  }, [currentQuestion.id, petEffect?.skill]);

  const handleAnswer = (answer: string | number) => {
    if (currentBattle.finished) return;

    if (answer === '') {
      submitTimeout(bonuses);
    } else {
      const question = currentBattle.questions[currentBattle.currentIndex];
      const isCorrect = question.answer === answer;

      if (!isCorrect && petEffect?.skill === 'hint') {
        setHintOption(getHintOption(question, petEffect));
      }

      submitAnswer(answer, profile.level, bonuses, petEffect);
    }
  };

  const handleFinish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    try {
      const result = await finishBattle(profile.level, profile.exp, petEffect);
      const rewardResult = await applyBattleRewards(result.stars, result.exp);
      await checkBattleAchievements(subject, currentBattle.levelNumber);
      navigate('/play/battle-result', { state: { ...result, ...rewardResult } });
    } catch {
      setIsFinishing(false);
    }
  };

  const handleEscape = () => {
    clearCurrentBattle();
    navigate('/play');
  };

  if (currentBattle.finished) {
    const correctCount = currentBattle.answers.filter((a: BattleAnswer) => a.correct).length;
    return (
      <div className="space-y-4">
        <div className="card text-center">
          <div className="mb-2 text-5xl">
            {currentBattle.result === 'win' ? '🏆' : '💔'}
          </div>
          <h2 className="text-2xl font-bold">
            {currentBattle.result === 'win' ? '战斗胜利！' : '战斗失败'}
          </h2>
          <p className="text-slate-500">
            答对 {correctCount}/{currentBattle.questions.length} 题
          </p>
        </div>
        <button
          type="button"
          onClick={handleFinish}
          disabled={isFinishing}
          className="btn-primary w-full disabled:opacity-60"
        >
          {isFinishing ? '结算中…' : '查看结算'}
        </button>
      </div>
    );
  }

  const sceneClass = SCENE_CLASS[subject];
  const levelName = assertV3Level(subject, currentBattle.levelNumber).topic;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold sm:text-lg">
            {SUBJECT_LABEL[subject]} · {levelName}
          </h2>
          <p className="text-xs text-slate-500">
            第 {currentBattle.currentIndex + 1}/{currentBattle.questions.length} 题
          </p>
        </div>
        <button
          type="button"
          onClick={handleEscape}
          className="rounded-xl bg-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-300 active:scale-95"
        >
          撤退
        </button>
      </div>

      <div className={`battle-arena ${sceneClass}`}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floatingTexts.map(ft => (
            <div
              key={ft.id}
              className="absolute top-1/2 z-10 animate-floatUp text-2xl font-black text-red-600 shadow-sm"
              style={{
                left: ft.side === 'hero' ? `calc(25% + ${ft.offsetX}px)` : `calc(75% + ${ft.offsetX}px)`
              }}
            >
              {ft.value}
            </div>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-between">
          <div className="animate-slideInLeft">
            <HeroAvatar
              profile={profile}
              bounce={heroBounce}
              attacking={heroAttacking}
              hurt={heroHurt}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-white/70 px-3 py-1 text-lg font-black text-slate-400 shadow-sm">
              VS
            </div>
            <ComboIndicator combo={currentBattle.combo} />
          </div>

          <div className="animate-slideInRight">
            <MonsterAvatar
              subject={subject}
              title={levelName}
              levelNumber={currentBattle.levelNumber}
              isBoss={currentBattle.isBoss}
              shake={monsterShake}
              attacking={monsterAttacking}
              hurt={monsterHurt}
            />
          </div>
        </div>
      </div>

      <div className="flex-1">
        <BattleQuestion
          question={currentQuestion}
          questionNumber={currentBattle.currentIndex + 1}
          totalQuestions={currentBattle.questions.length}
          timeLimitMs={getAnswerTimeLimitMs(bonuses)}
          onAnswer={handleAnswer}
          disabledOption={excludedOption}
          hintOption={hintOption}
        />
      </div>
    </div>
  );
}
