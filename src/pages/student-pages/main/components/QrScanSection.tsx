import React, { useState } from 'react';
import { useI18n } from '@/i18n/i18n';
import { ScanLine, CheckCircle, Loader2 } from 'lucide-react';
import { attendanceApi } from '@/functions/axios/axiosFunctions';

export const QrScanSection: React.FC = () => {
  const { t } = useI18n();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleScanQR = () => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.showScanQrPopup) {
      tg?.showAlert(t('home.qr.notSupported'));
      return;
    }

    setResult(null);
    setScanning(true);

    tg.showScanQrPopup(
      { text: t('home.qr.hint') },
      async (qrData: string) => {
        tg.closeScanQrPopup();
        
        try {
          const token = tg.initData || null;
          const response = await attendanceApi.scanCheckIn(qrData, token);

          setResult({
            success: response.data.success,
            message: response.data.message || t('home.qr.success'),
          });

          if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
          }
        } catch (error: unknown) {
          const errorMessage =
            (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            t('home.qr.error');
          setResult({ success: false, message: errorMessage });

          if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('error');
          }
        } finally {
          setScanning(false);
        }

        return true;
      }
    );
  };

  return (
    <div className="px-4 pb-6">
      {result && (
        <div
          className={`mb-3 p-3 rounded-[16px] text-[14px] font-medium text-center transition-all ${
            result.success
              ? 'bg-[#ECFDF5] text-[#065F46]'
              : 'bg-red-50 text-[#7F1D1D]'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {result.success && <CheckCircle size={16} />}
            {result.message}
          </div>
        </div>
      )}

      <button
        onClick={handleScanQR}
        disabled={scanning}
        className="w-full flex items-center justify-center gap-3 py-4 bg-[#1E3A8A] text-white rounded-[16px] font-semibold text-[16px] active:scale-[0.98] transition-all shadow-sm shadow-blue-900/20 disabled:opacity-60"
      >
        {scanning ? (
          <Loader2 size={22} className="animate-spin" />
        ) : (
          <ScanLine size={22} />
        )}
        {scanning ? t('home.qr.scanning') : t('home.qr.button')}
      </button>
    </div>
  );
};
