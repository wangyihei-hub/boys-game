import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MonsterAvatar } from '../components/play/MonsterAvatar';
import { HeroAvatar } from '../components/play/HeroAvatar';
import { BattleQuestion } from '../components/play/BattleQuestion';
import { ComboIndicator } from '../components/play/ComboIndicator';
import type { BattleAnswer } from '../types';
import { useGameStore, getStageById } from '../stores/gameStore';
import { useProfileStore } from '../stores/profileStore';
import { CORRECT_ANSWER_TIME_LIMIT_MS, getMaxPlayerHp } from '../services/battleLogic';

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

  const [monsterShake, setMonsterShake] = useState(false);
  const [heroBounce, setHeroBounce] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (!currentBattle && stageId && subject) {
      const stage = getStageById(stageId);
      if (!stage || stage.subject !== subject) {
        navigate('/play/map');
      }
    }
  }, [currentBattle, stageId, subject, navigate]);

  if (!currentBattle || !profile) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">加载战斗中…</div>
    );
  }

  const stage = currentBattle.stage;
  const maxPlayerHp = getMaxPlayerHp(profile.level);

  const handleAnswer = (answer: string | number) => {
    if (currentBattle.finished) return;

    const previousMonsterHp = currentBattle.monsterHp;
    const previousPlayerHp = currentBattle.playerHp;

    submitAnswer(answer, profile.level);

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
      const result = await finishBattle(profile.level, profile.exp);
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

  const currentQuestion = currentBattle.questions[currentBattle.currentIndex];

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

      <ComboIndicator combo={currentBattle.combo} />

      <BattleQuestion
        question={currentQuestion}
        questionNumber={currentBattle.currentIndex + 1}
        totalQuestions={currentBattle.questions.length}
        timeLimitMs={CORRECT_ANSWER_TIME_LIMIT_MS}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
