import { useEffect, useCallback, useRef } from 'react';

export function useTelegramBackButton(onBack: () => void, isActive: boolean = true) {
  const callbackRef = useRef(onBack);
  
  useEffect(() => {
    callbackRef.current = onBack;
  }, [onBack]);

  const handleBack = useCallback(() => {
    callbackRef.current();
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.BackButton || !isActive) return;

    tg.BackButton.show();
    tg.BackButton.onClick(handleBack);

    return () => {
      tg.BackButton.offClick(handleBack);
      tg.BackButton.hide();
    };
  }, [handleBack, isActive]);
}
