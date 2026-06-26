import { useEffect, useState } from 'react';
import { useParentStore } from '../stores/parentStore';
import { useProfileStore } from '../stores/profileStore';
import { isRestMode, shouldShowEyeCare } from '../services/usageLogic';

const EYE_CARE_STORAGE_KEY = 'boys-game-eye-care-last-reminder';

function readLastReminder(): number | undefined {
  try {
    const raw = localStorage.getItem(EYE_CARE_STORAGE_KEY);
    if (!raw) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

function writeLastReminder(timestamp: number) {
  try {
    localStorage.setItem(EYE_CARE_STORAGE_KEY, String(timestamp));
  } catch {
    // ignore storage errors
  }
}

export function useHealthGuard() {
  const settings = useParentStore(state => state.settings);
  const loaded = useProfileStore(state => state.loaded);

  const [isRestModeActive, setIsRestModeActive] = useState(false);
  const [showEyeCare, setShowEyeCare] = useState(false);
  const [lastReminderAt, setLastReminderAt] = useState<number | undefined>(() => readLastReminder());

  useEffect(() => {
    if (!loaded || !settings) return;

    const check = () => {
      const nowDate = new Date();
      const currentHour = nowDate.getHours();
      setIsRestModeActive(isRestMode(settings, currentHour));

      const now = Date.now();
      if (shouldShowEyeCare(lastReminderAt, settings.eyeCareIntervalMinutes, now)) {
        setShowEyeCare(true);
        setLastReminderAt(now);
        writeLastReminder(now);
      }
    };

    check();
    const intervalId = setInterval(check, 60_000);
    return () => clearInterval(intervalId);
  }, [loaded, settings, lastReminderAt]);

  const dismissEyeCare = () => {
    setShowEyeCare(false);
    const now = Date.now();
    setLastReminderAt(now);
    writeLastReminder(now);
  };

  return {
    isRestModeActive,
    showEyeCare,
    dismissEyeCare
  };
}
