import { useState } from 'react';
import { Eye, EyeOff, Lock, Shield } from 'lucide-react';
import { useParentStore } from '../../stores/parentStore';
import { isValidPinFormat } from '../../services/pinLogic';

type Mode = 'idle' | 'set' | 'verify_modify' | 'modify' | 'verify_clear';

export function PinSettingsCard() {
  const settings = useParentStore(state => state.settings);
  const updatePin = useParentStore(state => state.updatePin);
  const verifyPin = useParentStore(state => state.verifyPin);

  const [mode, setMode] = useState<Mode>('idle');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const resetForm = () => {
    setMode('idle');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError(null);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const showError = (message: string) => {
    setError(message);
    setSuccess(null);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError(null);
    window.setTimeout(() => setSuccess(null), 2000);
  };

  const handleVerifyCurrent = () => {
    if (!verifyPin(currentPin)) {
      showError('当前 PIN 不正确');
      return;
    }
    setCurrentPin('');
    setMode('modify');
  };

  const handleVerifyClear = async () => {
    if (!verifyPin(currentPin)) {
      showError('当前 PIN 不正确');
      return;
    }
    await updatePin(undefined);
    resetForm();
    showSuccess('PIN 已清除');
  };

  const handleSaveNewPin = async () => {
    if (!isValidPinFormat(newPin)) {
      showError('PIN 必须是 4-6 位数字');
      return;
    }
    if (newPin !== confirmPin) {
      showError('两次输入的 PIN 不一致');
      return;
    }
    await updatePin(newPin);
    resetForm();
    showSuccess(mode === 'set' ? 'PIN 已设置' : 'PIN 已修改');
  };

  const pinInput = (
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    toggle: () => void,
    label: string,
    placeholder: string,
    id: string
  ) => (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          inputMode="numeric"
          pattern="\d*"
          maxLength={6}
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
          placeholder={placeholder}
          className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 pr-10 outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={toggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={visible ? '隐藏 PIN' : '显示 PIN'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  if (!settings) {
    return (
      <div className="card">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold">家长锁 PIN</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">加载中...</p>
      </div>
    );
  }

  const pinExists = Boolean(settings.pin);

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-bold">家长锁 PIN</h2>
        <span
          className={[
            'rounded-full px-2.5 py-0.5 text-xs font-bold',
            pinExists ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
          ].join(' ')}
        >
          {pinExists ? '已设置' : '未设置'}
        </span>
      </div>

      <p className="text-sm text-slate-500">
        设置 4-6 位数字 PIN 后，进入家长后台时需要先验证，防止孩子误改设置。
      </p>

      {mode === 'idle' && (
        <div className="flex flex-wrap items-center gap-3">
          {!pinExists ? (
            <button
              type="button"
              onClick={() => setMode('set')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              设置 PIN
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMode('verify_modify')}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                修改 PIN
              </button>
              <button
                type="button"
                onClick={() => setMode('verify_clear')}
                className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2 font-semibold text-red-700 hover:bg-red-200 active:scale-95"
              >
                清除 PIN
              </button>
            </>
          )}
        </div>
      )}

      {mode === 'set' && (
        <div className="space-y-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/50 p-4">
          <h3 className="font-bold text-slate-800">设置新 PIN</h3>
          {pinInput(newPin, setNewPin, showNew, () => setShowNew(v => !v), '新 PIN', '4-6 位数字', 'pin-set-new')}
          {pinInput(
            confirmPin,
            setConfirmPin,
            showConfirm,
            () => setShowConfirm(v => !v),
            '确认新 PIN',
            '再次输入',
            'pin-set-confirm'
          )}
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSaveNewPin} className="btn-primary">
              保存
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              取消
            </button>
          </div>
        </div>
      )}

      {mode === 'verify_modify' && (
        <div className="space-y-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/50 p-4">
          <h3 className="font-bold text-slate-800">验证当前 PIN</h3>
          {pinInput(
            currentPin,
            setCurrentPin,
            showCurrent,
            () => setShowCurrent(v => !v),
            '当前 PIN',
            '请输入当前 PIN',
            'pin-verify-current'
          )}
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleVerifyCurrent} className="btn-primary">
              下一步
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              取消
            </button>
          </div>
        </div>
      )}

      {mode === 'modify' && (
        <div className="space-y-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/50 p-4">
          <h3 className="font-bold text-slate-800">修改 PIN</h3>
          {pinInput(newPin, setNewPin, showNew, () => setShowNew(v => !v), '新 PIN', '4-6 位数字', 'pin-modify-new')}
          {pinInput(
            confirmPin,
            setConfirmPin,
            showConfirm,
            () => setShowConfirm(v => !v),
            '确认新 PIN',
            '再次输入',
            'pin-modify-confirm'
          )}
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSaveNewPin} className="btn-primary">
              保存
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              取消
            </button>
          </div>
        </div>
      )}

      {mode === 'verify_clear' && (
        <div className="space-y-4 rounded-xl border-2 border-red-100 bg-red-50/50 p-4">
          <h3 className="font-bold text-slate-800">清除 PIN</h3>
          {pinInput(
            currentPin,
            setCurrentPin,
            showCurrent,
            () => setShowCurrent(v => !v),
            '当前 PIN',
            '请输入当前 PIN',
            'pin-clear-current'
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleVerifyClear}
              className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 font-semibold text-white shadow hover:bg-red-700 active:scale-95"
            >
              确认清除
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              取消
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {success && <p className="text-sm font-semibold text-green-600">{success}</p>}
    </div>
  );
}
