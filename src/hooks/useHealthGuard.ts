import { useEffect, useState } from 'react';
import { useParentStore } from '../stores/parentStore';
import { useProfileStore } from '../stores/profileStore';
import { isRestMode, shouldShowEyeCare } from '../services/usageLogic';

export function useHealthGuard() {
  const settings = useParentStore(state => state.settings);
  const loaded = useProfileStore(state => state.loaded);

  const [isRestModeActive, setIsRestModeActive] = useState(false);
  const [showEyeCare, setShowEyeCare] = useState(false);
  const [lastReminderAt, setLastReminderAt] = useState<number | undefined>(undefined);

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
      }
    };

    check();
    const intervalId = setInterval(check, 60_000);
    return () => clearInterval(intervalId);
  }, [loaded, settings, lastReminderAt]);

  const dismissEyeCare = () => {
    setShowEyeCare(false);
  };

  return {
    isRestModeActive,
    showEyeCare,
    dismissEyeCare
  };
}
