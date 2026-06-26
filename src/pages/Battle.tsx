import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MonsterAvatar } from '../components/play/MonsterAvatar';
import { HeroAvatar } from '../components/play/HeroAvatar';
import { BattleQuestion } from '../components/play/BattleQuestion';
import { ComboIndicator } from '../components/play/ComboIndicator';
import type { BattleAnswer, Question } from '../types';
import { useGameStore, getStageById } from '../stores/gameStore';
import { useProfileStore } from '../stores/profileStore';
import { useEconomyStore } from '../stores/economyStore';
import { getAnswerTimeLimitMs, getMaxPlayerHp, getHintOption, getExcludedOption } from '../services/battleLogic';
import { computeEquipmentBonuses } from '../services/equipmentLogic';
import { getPetInstance, computePetSkillEffect } from '../services/petLogic';
import type { PetSkillEffect } from '../services/petLogic';

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
    setHealAmount(0);
  }, [currentBattle?.currentIndex]);

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

    const previousMonsterHp = currentBattle.monsterHp;
    const previousPlayerHp = currentBattle.playerHp;

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

    const nextBattle = { ...currentBattle };
    // 手动应用一帧变化以触发动画，因为 Zustand 的 set 是异步的
    // 这里我们依赖 currentBattle 在下一次渲染时更新
    if (nextBattle.monsterHp < previousMonsterHp) {
      setMonsterShake(true);
      setTimeout(() => setMonsterShake(false), 400);
    }
    if (nextBattle.playerHp < previousPlayerHp) {
      setHeroBounce(true);
      setTimeout(() => setHeroBounce(false), 400);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{stage.name}</h2>
        <button
          type="button"
          onClick={handleEscape}
          className="text-sm font-semibold text-slate-500 underline"
        >
          撤退
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <HeroAvatar
          profile={profile}
          hp={currentBattle.playerHp}
          maxHp={maxPlayerHp}
          bounce={heroBounce}
        />
        <div className="text-2xl font-bold text-slate-300">VS</div>
        <MonsterAvatar
          stage={stage}
          hp={currentBattle.monsterHp}
          maxHp={stage.monsterHp}
          shake={monsterShake}
        />
      </div>

      {healAmount > 0 && (
        <div className="text-center text-lg font-bold text-green-600 animate-bounceShort">
          +{healAmount} 生命恢复
        </div>
      )}

      <ComboIndicator combo={currentBattle.combo} />

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
  );
}
