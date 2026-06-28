import { Link } from 'react-router-dom';
import { ArrowLeft, CircleDot, Brain, Puzzle, Zap, Link2 } from 'lucide-react';
import { useProfileStore } from '../stores/profileStore';

const GAMES = [
  {
    to: '/play/arcade/gomoku',
    label: '休闲五子棋',
    desc: '人机对战',
    icon: CircleDot,
    color: 'bg-slate-100 text-slate-700'
  },
  {
    to: '/play/arcade/trivia',
    label: '百科问答',
    desc: '知识挑战',
    icon: Brain,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    to: '/play/arcade/memory',
    label: '记忆翻牌',
    desc: '考验记忆力',
    icon: Puzzle,
    color: 'bg-pink-100 text-pink-600'
  },
  {
    to: '/play/arcade/speedmath',
    label: '速算挑战',
    desc: '限时心算',
    icon: Zap,
    color: 'bg-amber-100 text-amber-600'
  },
  {
    to: '/play/arcade/wordchain',
    label: '词语接龙',
    desc: '词语对战',
    icon: Link2,
    color: 'bg-teal-100 text-teal-600'
  }
];

export function Arcade() {
  const profile = useProfileStore(state => state.profile);

  return (
    <div className="scene-camp -mx-2 -mt-2 min-h-full rounded-t-3xl p-3 sm:-mx-4 sm:-mt-4 sm:p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="glass-card flex items-center gap-3">
          <Link to="/play" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition active:scale-95">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-slate-800">副本乐园</h2>
            <p className="text-xs text-slate-500">玩趣味小游戏，赢星星奖励</p>
          </div>
        </div>

        {profile?.minigameStats && (
          <div className="glass-card grid grid-cols-2 gap-3 text-center text-xs font-semibold text-slate-600 sm:grid-cols-5">
            <div className="rounded-xl bg-white/50 p-2">
              <div className="text-lg font-bold text-slate-800">{profile.minigameStats.gomokuWins}</div>
              <div>五子棋胜</div>
            </div>
            <div className="rounded-xl bg-white/50 p-2">
              <div className="text-lg font-bold text-slate-800">{profile.minigameStats.triviaCorrect}</div>
              <div>答对题数</div>
            </div>
            <div className="rounded-xl bg-white/50 p-2">
              <div className="text-lg font-bold text-slate-800">{profile.minigameStats.memorySRankCount}</div>
              <div>S 评价</div>
            </div>
            <div className="rounded-xl bg-white/50 p-2">
              <div className="text-lg font-bold text-slate-800">{profile.minigameStats.speedMathSRankCount}</div>
              <div>速算 S</div>
            </div>
            <div className="rounded-xl bg-white/50 p-2">
              <div className="text-lg font-bold text-slate-800">{profile.minigameStats.wordChainCount}</div>
              <div>接龙次数</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {GAMES.map(game => {
            const Icon = game.icon;
            return (
              <Link
                key={game.to}
                to={game.to}
                className="glass-card flex flex-col items-center gap-2 text-center transition hover:scale-[1.02] hover:bg-white/80 active:scale-95"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${game.color}`}>
                  <Icon className="h-7 w-7" />
                </div>
                <span className="font-bold text-slate-700">{game.label}</span>
                <span className="text-xs text-slate-500">{game.desc}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
