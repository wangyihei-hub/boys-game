import { useState } from 'react';
import { X } from 'lucide-react';
import { useProfileStore } from '../../stores/profileStore';

const AVATARS = ['🧒', '👧', '🧑', '👦', '👩', '🧑‍🚀', '🧑‍🎓', '🦁', '🐯', '🐼'];

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const profile = useProfileStore(state => state.profile);
  const updateProfile = useProfileStore(state => state.updateProfile);
  const [nickname, setNickname] = useState(profile?.nickname ?? '');

  if (!open || !profile) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">个人设置</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-slate-600">昵称</label>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            maxLength={12}
          />
        </div>
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-slate-600">头像</label>
          <div className="grid grid-cols-5 gap-2">
            {AVATARS.map(emoji => (
              <button
                key={emoji}
                onClick={() => updateProfile({ avatar: emoji })}
                className={[
                  'flex h-10 items-center justify-center rounded-xl text-xl transition',
                  profile.avatar === emoji ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-slate-100 hover:bg-slate-200'
                ].join(' ')}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => { updateProfile({ nickname }); onClose(); }}
          className="w-full rounded-xl bg-indigo-600 py-2.5 font-bold text-white active:scale-95"
        >
          保存
        </button>
      </div>
    </div>
  );
}
