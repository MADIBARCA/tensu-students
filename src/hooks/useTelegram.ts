// src/hooks/useTelegram.ts
import { useEffect, useState, useCallback } from 'react';

export type TelegramUser = {
  photo_url?: string;
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  language_code?: string;
};

export interface TelegramContactResult {
  response: string;
  responseUnsafe?: {
    contact?: {
      phone_number?: string;
      first_name?: string;
      last_name?: string;
      user_id?: number;
    };
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        [x: string]: any;
        isVersionAtLeast(version: string): boolean;
        disableVerticalSwipes(): void;
        expand(): void;
        initData: string;
        initDataUnsafe: { user: TelegramUser };
        ready: () => void;
        sendData: (data: string) => void;
        showAlert: (message: string) => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        requestContact: (callback: (granted: boolean, result: TelegramContactResult) => void) => void;
      };
    };
  }
}

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.warn('⚠️ Telegram WebApp is not available');
      return;
    }

    tg.ready();
    setUser(tg.initDataUnsafe.user);
  }, []);

  const sendData = useCallback((payload: Record<string, unknown>) => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.error('❌ Cannot send data – Telegram WebApp not available');
      return;
    }
    tg.sendData(JSON.stringify(payload));
  }, []);

  const requestContact = useCallback((callback: (granted: boolean, result: TelegramContactResult) => void) => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.requestContact) {
      console.error('❌ requestContact is not available');
      callback(false, { response: '' });
      return;
    }
    tg.requestContact(callback);
  }, []);

  return { user, sendData, requestContact };
}
