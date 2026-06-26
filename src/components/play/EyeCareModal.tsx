import { useEffect, useState } from 'react';

interface EyeCareModalProps {
  show: boolean;
  onDismiss: () => void;
}

const COUNTDOWN_SECONDS = 60;

export function EyeCareModal({ show, onDismiss }: EyeCareModalProps) {
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (!show) {
      setRemaining(COUNTDOWN_SECONDS);
      return;
    }

    setRemaining(COUNTDOWN_SECONDS);
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);

    return () => clearInterval(timer);
  }, [show]);

  if (!show) {
    return null;
  }

  const canDismiss = remaining === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-sm rounded-3xl border-4 border-green-400 bg-white p-6 text-center shadow-xl">
        <div className="mb-4 text-6xl animate-bounceShort">👀</div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">护眼时间到！</h2>
        <p className="mb-6 text-slate-600">请休息一会儿，看看远处，让眼睛放松一下吧。</p>

        <div className="mb-6 flex items-center justify-center">
          <div className="rounded-full bg-green-100 px-6 py-3 text-3xl font-mono font-bold text-green-700">
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:
            {String(remaining % 60).padStart(2, '0')}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          disabled={!canDismiss}
          className={`w-full rounded-xl px-6 py-3 font-semibold text-white shadow transition ${
            canDismiss
              ? 'bg-green-600 hover:bg-green-700 active:scale-95'
              : 'cursor-not-allowed bg-slate-300'
          }`}
        >
          {canDismiss ? '我知道了' : `请休息 ${remaining} 秒`}
        </button>
      </div>
    </div>
  );
}
