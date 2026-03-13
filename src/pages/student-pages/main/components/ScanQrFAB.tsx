import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n/i18n';
import { ScanLine, Loader2 } from 'lucide-react';
import { attendanceApi, scheduleApi } from '@/functions/axios/axiosFunctions';
import { toLocalDateString } from '@/lib/utils/dateUtils';
import { getTrainingLiveStatus } from '@/lib/utils/trainingStatus';
import { toast } from 'react-toastify';
import type { SessionResponse } from '@/functions/axios/responses';

/** Amber accent matching "Отметка QR" badge */
const ACCENT = {
  bg: '#F59E0B',
  glow: 'rgba(245, 158, 11, 0.35)',
  ring: 'rgba(245, 158, 11, 0.4)',
};

const fetchActiveQrCheckin = async (): Promise<boolean> => {
  try {
    const tg = window.Telegram?.WebApp;
    const token = tg?.initData || null;
    const response = await scheduleApi.getNext(token, 30);
    const sessions = response.data as SessionResponse[];

    return sessions.some((s) => {
      const date = (s.date || '').slice(0, 10);
      const status = getTrainingLiveStatus(date, s.time, s.duration_minutes || 60);
      return status === 'in_progress' && s.is_booked && !s.is_attended;
    });
  } catch {
    return false;
  }
};

export const ScanQrFAB: React.FC = () => {
  const { t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const [needsQrCheckin, setNeedsQrCheckin] = useState(false);

  const refresh = useCallback(async () => {
    const active = await fetchActiveQrCheckin();
    setNeedsQrCheckin(active);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

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
            refresh();
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

  const isActive = needsQrCheckin && !scanning;

  return (
    <>
      <style>{`
        @keyframes qr-fab-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes qr-fab-ring {
          0% { transform: scale(1); opacity: 0.45; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes qr-fab-glow {
          0%, 100% { box-shadow: 0 4px 20px 0 rgba(245, 158, 11, 0.28); }
          50% { box-shadow: 0 4px 32px 10px rgba(245, 158, 11, 0.42); }
        }
        .qr-fab-active {
          animation: qr-fab-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite,
                     qr-fab-glow 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .qr-fab-ring {
          animation: qr-fab-ring 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
      <div className="fixed bottom-[90px] right-4 z-50 flex items-center justify-center w-14 h-14">
        {isActive && (
          <>
            <span
              className="qr-fab-ring absolute inset-0 rounded-full border-2 pointer-events-none"
              style={{ borderColor: ACCENT.ring }}
            />
            <span
              className="qr-fab-ring absolute inset-0 rounded-full border-2 pointer-events-none"
              style={{ borderColor: ACCENT.ring, animationDelay: '1s' }}
            />
          </>
        )}
        <button
          onClick={handleScanQR}
          disabled={scanning}
          className={`
            flex items-center justify-center w-14 h-14 rounded-full text-white
            transition-colors duration-300 ease-out
            active:scale-[0.95]
            ${isActive ? 'qr-fab-active' : 'transition-shadow duration-300'}
          `}
          style={{
            backgroundColor: isActive ? ACCENT.bg : '#1E3A8A',
            boxShadow: isActive
              ? undefined
              : '0 4px 14px 0 rgba(30, 58, 138, 0.39)',
          }}
        >
          {scanning ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <ScanLine size={24} />
          )}
        </button>
      </div>
    </>
  );
};
