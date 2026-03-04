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
    const backButton = tg?.BackButton;
    if (!backButton || !isActive) return;

    backButton.show();
    backButton.onClick(handleBack);

    return () => {
      backButton.offClick(handleBack);
      backButton.hide();
    };
  }, [handleBack, isActive]);
}
