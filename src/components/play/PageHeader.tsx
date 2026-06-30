import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Zap } from 'lucide-react';
import { useProfileStore } from '../../stores/profileStore';
import { MAX_STAMINA } from '../../services/staminaLogic';
import { StatusCapsule } from './StatusCapsule';

interface PageHeaderProps {
  title: string;
  showStats?: boolean;
}

export function PageHeader({ title, showStats = true }: PageHeaderProps) {
  const navigate = useNavigate();
  const profile = useProfileStore(state => state.profile);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-white/80 px-4 py-3 backdrop-blur-md">
      <button
        onClick={() => navigate('/play')}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm active:scale-95"
        aria-label="返回"
      >
        <ArrowLeft className="h-5 w-5 text-slate-600" />
      </button>
      <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      {showStats && profile ? (
        <div className="flex items-center gap-2">
          <StatusCapsule icon={Star} value={profile.stars} iconClass="fill-yellow-400 text-yellow-400" />
          <StatusCapsule icon={Zap} value={`${profile.stamina}/${MAX_STAMINA}`} iconClass="fill-yellow-400 text-yellow-400" />
        </div>
      ) : (
        <div className="w-10" />
      )}
    </header>
  );
}
