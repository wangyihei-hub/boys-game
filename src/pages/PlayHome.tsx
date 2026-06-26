import { useProfileStore } from '../stores/profileStore';

export function PlayHome() {
  const profile = useProfileStore(state => state.profile);

  if (!profile) return null;

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">昵称</p>
          <p className="text-lg font-bold">{profile.nickname}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">星星</p>
          <p className="text-2xl font-bold text-yellow-500">{profile.stars}</p>
        </div>
      </div>
      <div className="card">
        <p className="text-sm text-slate-500">等级</p>
        <p className="text-lg font-bold">Lv.{profile.level}</p>
        <p className="text-sm text-slate-500">经验 {profile.exp}</p>
      </div>
    </div>
  );
}
