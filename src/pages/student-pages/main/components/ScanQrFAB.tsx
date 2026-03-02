import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/i18n';
import { ScanLine, Loader2 } from 'lucide-react';
import { attendanceApi, scheduleApi } from '@/functions/axios/axiosFunctions';
import { toast } from 'react-toastify';
import type { SessionResponse } from '@/functions/axios/responses';

export const ScanQrFAB: React.FC = () => {
  const { t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const [hasTrainingToday, setHasTrainingToday] = useState(false);

  useEffect(() => {
    const checkTrainingToday = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        // Fetch a few upcoming sessions to see if any are today
        const response = await scheduleApi.getNext(token, 10);
        const todayStr = new Date().toISOString().split('T')[0];
        
        const hasToday = response.data.some((s: SessionResponse) => s.date === todayStr);
        setHasTrainingToday(hasToday);
      } catch (error) {
        console.error('Failed to check training for today:', error);
      }
    };
    
    checkTrainingToday();
  }, []);

  const handleScanQR = () => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.showScanQrPopup) {
      toast.error(t('home.qr.notSupported'));
      return;
    }

    setScanning(true);

    const resetScanning = () => {
      setScanning(false);
    };

    const handlePopupClosed = () => {
      tg.offEvent?.('scanQrPopupClosed', handlePopupClosed);
      window.removeEventListener('focus', handleFocusFallback);
      resetScanning();
    };

    const handleFocusFallback = () => {
      window.removeEventListener('focus', handleFocusFallback);
      resetScanning();
    };

    if (tg.onEvent && tg.isVersionAtLeast?.('7.7')) {
      tg.onEvent('scanQrPopupClosed', handlePopupClosed);
    } else {
      window.addEventListener('focus', handleFocusFallback);
    }

    tg.showScanQrPopup(
      { text: t('home.qr.hint') },
      async (qrData: string) => {
        tg.closeScanQrPopup?.();
        tg.offEvent?.('scanQrPopupClosed', handlePopupClosed);
        window.removeEventListener('focus', handleFocusFallback);

        if (!qrData?.trim()) {
          resetScanning();
          return true;
        }

        try {
          const token = tg.initData || null;
          const response = await attendanceApi.scanCheckIn(qrData, token);

          if (response.data.success) {
            toast.success(response.data.message || t('home.qr.success'));
            if (tg.HapticFeedback) {
              tg.HapticFeedback.notificationOccurred('success');
            }
          } else {
            toast.error(response.data.message || t('home.qr.error'));
            if (tg.HapticFeedback) {
              tg.HapticFeedback.notificationOccurred('error');
            }
          }
        } catch (error: unknown) {
          const errorMessage =
            (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            t('home.qr.error');
          toast.error(errorMessage);
          if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('error');
          }
        } finally {
          resetScanning();
        }

        return true;
      }
    );
  };

  return (
    <button
      onClick={handleScanQR}
      disabled={scanning}
      className={`fixed bottom-[90px] right-4 z-50 flex items-center justify-center w-14 h-14 bg-[#1E3A8A] text-white rounded-full transition-all active:scale-[0.95] ${
        hasTrainingToday && !scanning ? 'animate-pulse' : ''
      }`}
      style={{
        boxShadow: '0 4px 14px 0 rgba(30, 58, 138, 0.39)'
      }}
    >
      {scanning ? (
        <Loader2 size={24} className="animate-spin" />
      ) : (
        <ScanLine size={24} />
      )}
    </button>
  );
};
