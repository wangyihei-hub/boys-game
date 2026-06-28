import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MonsterAvatar } from '../components/play/MonsterAvatar';
import { HeroAvatar } from '../components/play/HeroAvatar';
import { BattleQuestion } from '../components/play/BattleQuestion';
import { ComboIndicator } from '../components/play/ComboIndicator';
import type { BattleAnswer, Question, Subject } from '../types';
import { useGameStore, getStageById } from '../stores/gameStore';
import { useProfileStore } from '../stores/profileStore';
import { useEconomyStore } from '../stores/economyStore';
import { getAnswerTimeLimitMs, getMaxPlayerHp, getHintOption, getExcludedOption } from '../services/battleLogic';
import { computeEquipmentBonuses } from '../services/equipmentLogic';
import { getPetInstance, computePetSkillEffect } from '../services/petLogic';
import type { PetSkillEffect } from '../services/petLogic';

interface FloatingText {
  id: number;
  value: string;
  type: 'damage' | 'heal';
  side: 'hero' | 'monster';
  offsetX: number;
}

const SCENE_CLASS: Record<Subject, string> = {
  chinese: 'scene-chinese',
  math: 'scene-math',
  english: 'scene-english'
};

export function Battle() {
  const { subject, stageId } = useParams<{ subject: string; stageId: string }>();
  const navigate = useNavigate();

  const profile = useProfileStore(state => state.profile);
  const applyBattleRewards = useProfileStore(state => state.applyBattleRewards);
  const checkBattleAchievements = useProfileStore(state => state.checkBattleAchievements);
  const currentBattle = useGameStore(state => state.currentBattle);
  const submitAnswer = useGameStore(state => state.submitAnswer);
  const finishBattle = useGameStore(state => state.finishBattle);
  const clearCurrentBattle = useGameStore(state => state.clearCurrentBattle);
  const inventory = useEconomyStore(state => state.inventory);
  const loadInventory = useEconomyStore(state => state.loadInventory);
  const submitTimeout = useGameStore(state => state.submitTimeout);

  const [monsterShake, setMonsterShake] = useState(false);
  const [heroBounce, setHeroBounce] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [hintOption, setHintOption] = useState<number | undefined>(undefined);
  const [healAmount, setHealAmount] = useState(0);

  const [heroAttacking, setHeroAttacking] = useState(false);
  const [monsterAttacking, setMonsterAttacking] = useState(false);
  const [heroHurt, setHeroHurt] = useState(false);
  const [monsterHurt, setMonsterHurt] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  const prevMonsterHpRef = useRef<number | undefined>(undefined);
  const prevPlayerHpRef = useRef<number | undefined>(undefined);
  const floatIdRef = useRef(0);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    if (!currentBattle && stageId && subject) {
      const stage = getStageById(stageId);
      if (!stage || stage.subject !== subject) {
        navigate('/play/map');
      }
    }
  }, [currentBattle, stageId, subject, navigate]);

  useEffect(() => {
    setHintOption(undefined);
    if (healAmount > 0) {
      const timer = window.setTimeout(() => setHealAmount(0), 800);
      return () => window.clearTimeout(timer);
    }
  }, [currentBattle?.currentIndex]);

  const addFloatingText = (value: string, side: 'hero' | 'monster', type: 'damage' | 'heal') => {
    const id = ++floatIdRef.current;
    const offsetX = Math.round((Math.random() - 0.5) * 40);
    setFloatingTexts(prev => [...prev, { id, value, side, type, offsetX }]);
    window.setTimeout(() => {
      setFloatingTexts(prev => prev.filter(f => f.id !== id));
    }, 800);
  };

  useEffect(() => {
    if (!currentBattle) {
      prevMonsterHpRef.current = undefined;
      prevPlayerHpRef.current = undefined;
      return;
    }

    const monsterHp = currentBattle.monsterHp;
    const playerHp = currentBattle.playerHp;
    let monsterTimer: number | undefined;
    let heroTimer: number | undefined;
    let attackTimer: number | undefined;
    let mAttackTimer: number | undefined;

    if (prevMonsterHpRef.current !== undefined && monsterHp !== prevMonsterHpRef.current) {
      const diff = monsterHp - prevMonsterHpRef.current;
      if (diff < 0) {
        setMonsterShake(true);
        setHeroAttacking(true);
        setMonsterHurt(true);
        addFloatingText(String(Math.abs(diff)), 'monster', 'damage');
        monsterTimer = window.setTimeout(() => setMonsterShake(false), 400);
        attackTimer = window.setTimeout(() => {
          setHeroAttacking(false);
          setMonsterHurt(false);
        }, 400);
      } else if (diff > 0) {
        addFloatingText(`+${diff}`, 'monster', 'heal');
      }
    }

    if (prevPlayerHpRef.current !== undefined && playerHp !== prevPlayerHpRef.current) {
      const diff = playerHp - prevPlayerHpRef.current;
      if (diff < 0) {
        setHeroBounce(true);
        setMonsterAttacking(true);
        setHeroHurt(true);
        addFloatingText(String(Math.abs(diff)), 'hero', 'damage');
        heroTimer = window.setTimeout(() => setHeroBounce(false), 400);
        mAttackTimer = window.setTimeout(() => {
          setMonsterAttacking(false);
          setHeroHurt(false);
        }, 400);
      } else if (diff > 0) {
        addFloatingText(`+${diff}`, 'hero', 'heal');
      }
    }

    prevMonsterHpRef.current = monsterHp;
    prevPlayerHpRef.current = playerHp;

    return () => {
      if (monsterTimer !== undefined) window.clearTimeout(monsterTimer);
      if (heroTimer !== undefined) window.clearTimeout(heroTimer);
      if (attackTimer !== undefined) window.clearTimeout(attackTimer);
      if (mAttackTimer !== undefined) window.clearTimeout(mAttackTimer);
    };
  }, [currentBattle?.monsterHp, currentBattle?.playerHp]);

  if (!currentBattle || !profile) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">加载战斗中…</div>
    );
  }

  const stage = currentBattle.stage;
  const bonuses = computeEquipmentBonuses(inventory, profile.equippedItems);
  const maxPlayerHp = getMaxPlayerHp(profile.level, bonuses);

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
      const question: Question = currentBattle.questions[currentBattle.currentIndex];
      const isCorrect = question.answer === answer;

      if (!isCorrect && petEffect?.skill === 'hint') {
        setHintOption(getHintOption(question, petEffect));
      }

      if (isCorrect && petEffect?.skill === 'heal') {
        const correctCount = currentBattle.answers.filter(a => a.correct).length + 1;
        if (correctCount % 3 === 0) {
          setHealAmount(petEffect.healAmount ?? 0);
        }
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
      if (subject && stageId) {
        await checkBattleAchievements(subject, stageId);
      }
      navigate('/play/battle-result', { state: { ...result, ...rewardResult } });
    } catch {
      setIsFinishing(false);
    }
  };

  const handleEscape = () => {
    clearCurrentBattle();
    navigate('/play/map');
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

  const sceneClass = SCENE_CLASS[stage.subject];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold sm:text-lg">{stage.name}</h2>
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
              className={[
                'absolute top-1/2 z-10 animate-floatUp text-2xl font-black shadow-sm',
                ft.type === 'damage' ? 'text-red-600' : 'text-green-600'
              ].join(' ')}
              style={{
                left: ft.side === 'hero' ? `calc(25% + ${ft.offsetX}px)` : `calc(75% + ${ft.offsetX}px)`
              }}
            >
              {ft.type === 'damage' ? `-${ft.value}` : ft.value}
            </div>
          ))}
        </div>

        <div className="flex flex-1 items-center justify-between">
          <div className="animate-slideInLeft">
            <HeroAvatar
              profile={profile}
              hp={currentBattle.playerHp}
              maxHp={maxPlayerHp}
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
              stage={stage}
              hp={currentBattle.monsterHp}
              maxHp={stage.monsterHp}
              shake={monsterShake}
              attacking={monsterAttacking}
              hurt={monsterHurt}
            />
          </div>
        </div>

        {healAmount > 0 && (
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 animate-bounceShort text-lg font-bold text-green-600">
            +{healAmount} 生命恢复
          </div>
        )}
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
