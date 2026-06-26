import { useEffect, useState } from 'react';
import { useParentStore } from '../../stores/parentStore';

interface RestModeOverlayProps {
  isActive: boolean;
}

export function RestModeOverlay({ isActive }: RestModeOverlayProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!isActive) {
      setDismissed(false);
      setShowPinInput(false);
      setPin('');
      setPinError(null);
      return;
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1_000);
    return () => clearInterval(timer);
  }, [isActive]);

  if (!isActive || dismissed) {
    return null;
  }

  const handleParentUnlock = () => {
    const ok = useParentStore.getState().verifyPin(pin);
    if (ok) {
      setDismissed(true);
      setShowPinInput(false);
      setPin('');
      setPinError(null);
    } else {
      setPinError('PIN 不正确，请重试');
      setPin('');
    }
  };

  const timeText = currentTime.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-900/90 p-6 text-center text-white">
      <div className="text-6xl animate-bounceShort">🌙</div>
      <h2 className="text-3xl font-bold">现在是休息时间</h2>
      <p className="text-5xl font-mono">{timeText}</p>
      <p className="max-w-md text-lg text-slate-200">
        明天再来闯关吧！充足的睡眠才能让你变成更强的小勇士哦。
      </p>

      {!showPinInput ? (
        <button
          type="button"
          onClick={() => setShowPinInput(true)}
          className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-700 active:scale-95"
        >
          我是家长
        </button>
      ) : (
        <div className="mt-4 flex w-full max-w-xs flex-col gap-3 rounded-2xl bg-white p-5 text-slate-900 shadow-lg">
          <label htmlFor="rest-pin" className="text-left text-sm font-semibold">
            请输入家长 PIN
          </label>
          <input
            id="rest-pin"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleParentUnlock();
            }}
            className="rounded-xl border-2 border-slate-300 px-4 py-2 text-center text-lg outline-none focus:border-indigo-500"
            placeholder="••••"
            autoFocus
          />
          {pinError && <p className="text-sm text-red-600">{pinError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowPinInput(false);
                setPin('');
                setPinError(null);
              }}
              className="flex-1 rounded-xl bg-slate-200 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-300 active:scale-95"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleParentUnlock}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 active:scale-95"
            >
              解除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
