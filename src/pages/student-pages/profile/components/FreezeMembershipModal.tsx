import React, { useState, useMemo } from 'react';
import { X, Snowflake, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { membershipsApi } from '@/functions/axios/axiosFunctions';
import { useI18n } from '@/i18n/i18n';
import { getErrorMessage } from '@/lib/utils/errorHandler';

interface FreezeMembershipModalProps {
  membership: {
    id: number;
    status: string;
    freeze_days_available?: number;
    freeze_days_used?: number;
    freeze_start_date?: string | null;
    freeze_end_date?: string | null;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export const FreezeMembershipModal: React.FC<FreezeMembershipModalProps> = ({
  membership,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnfreezeConfirm, setShowUnfreezeConfirm] = useState(false);

  const freezeDaysAvailable = membership.freeze_days_available || 0;
  const isFrozen = membership.status === 'frozen';

  const calculateFreezeDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate days that will be deducted on early unfreeze
  const daysToDeduct = useMemo(() => {
    if (!isFrozen || !membership.freeze_start_date) return 0;
    const freezeStart = new Date(membership.freeze_start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    freezeStart.setHours(0, 0, 0, 0);
    
    if (today < freezeStart) return 0;
    
    const diffTime = today.getTime() - freezeStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [isFrozen, membership.freeze_start_date]);

  // Format freeze dates for display
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const freezeDays = calculateFreezeDays();
  
  // Validate that start date is at least tomorrow
  const isStartDateValid = useMemo(() => {
    if (!startDate) return true; // Allow empty for now
    const start = new Date(startDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    return start >= tomorrow;
  }, [startDate]);
  
  const isValid = freezeDays >= 1 && freezeDays <= 30 && freezeDays <= freezeDaysAvailable && isStartDateValid;

  const handleFreeze = async () => {
    if (!isValid) return;

    setProcessing(true);
    setError(null);
    
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      
      await membershipsApi.freeze({
        enrollment_id: membership.id,
        start_date: startDate,
        end_date: endDate,
      }, token);
      
      // Show success message
      if (tg) {
        tg.showAlert('Абонемент успешно заморожен. Тренер уведомлен.');
      }
      
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error('Freeze failed:', err);
      const errorMessage = getErrorMessage(err, 'Ошибка при заморозке абонемента');
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleUnfreeze = async () => {
    setProcessing(true);
    setError(null);
    
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      
      await membershipsApi.unfreeze({
        enrollment_id: membership.id,
      }, token);
      
      // Show success message
      if (tg) {
        tg.showAlert('Абонемент успешно разморожен');
      }
      
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error('Unfreeze failed:', err);
      const errorMessage = getErrorMessage(err, 'Ошибка при разморозке абонемента');
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Snowflake size={20} />
            {isFrozen ? 'Разморозить абонемент' : 'Заморозить абонемент'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isFrozen ? (
          showUnfreezeConfirm ? (
            // Unfreeze confirmation dialog
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800 mb-1">
                      {t('freeze.unfreeze.confirmTitle')}
                    </p>
                    <p className="text-sm text-amber-700">
                      {t('freeze.unfreeze.confirmMessage', { days: daysToDeduct })}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Summary of used days */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('freeze.frozenFrom')}</span>
                  <span className="font-medium text-gray-900">{formatDate(membership.freeze_start_date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('freeze.daysUsed')}</span>
                  <span className="font-medium text-gray-900">{daysToDeduct} {t('freeze.days')}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnfreezeConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleUnfreeze}
                  disabled={processing}
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {processing ? t('common.processing') : (
                    <>
                      <CheckCircle size={18} />
                      {t('freeze.unfreeze.confirm')}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Frozen status view
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Snowflake size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">{t('freeze.currentlyFrozen')}</p>
                    <p className="text-xs text-blue-600">{t('freeze.canUnfreezeAnytime')}</p>
                  </div>
                </div>
                
                {/* Freeze period info */}
                <div className="bg-white/60 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('freeze.start.date')}</span>
                    <span className="font-medium text-gray-900">{formatDate(membership.freeze_start_date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('freeze.end.date')}</span>
                    <span className="font-medium text-gray-900">{formatDate(membership.freeze_end_date)}</span>
                  </div>
                  <div className="border-t border-blue-100 pt-2 mt-2 flex justify-between text-sm">
                    <span className="text-gray-600">{t('freeze.daysElapsed')}</span>
                    <span className="font-semibold text-blue-700">{daysToDeduct} {t('freeze.days')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  {t('common.close')}
                </button>
                <button
                  onClick={() => setShowUnfreezeConfirm(true)}
                  className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                >
                  {t('freeze.unfreeze.process')}
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-gray-600" />
                <p className="text-sm font-medium text-gray-900">Доступно дней для заморозки</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{freezeDaysAvailable}</p>
              <p className="text-xs text-gray-500 mt-1">
                Максимальный срок заморозки: 30 дней
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата начала заморозки
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={tomorrowStr}
                className="w-full border border-gray-200 rounded-lg p-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Минимальная дата: завтра ({tomorrow.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })})
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата окончания заморозки
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || tomorrowStr}
                className="w-full border border-gray-200 rounded-lg p-2"
              />
            </div>

            {freezeDays > 0 && (
              <div className={`p-3 rounded-lg ${
                isValid ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={`text-sm ${isValid ? 'text-green-800' : 'text-red-800'}`}>
                  {isValid
                    ? `Выбрано дней: ${freezeDays}`
                    : !isStartDateValid
                    ? 'Дата начала заморозки должна быть не раньше завтрашнего дня'
                    : freezeDays > 30
                    ? 'Максимальный срок заморозки: 30 дней'
                    : freezeDays > freezeDaysAvailable
                    ? `Доступно только ${freezeDaysAvailable} дней`
                    : 'Минимальный срок заморозки: 1 день'}
                </p>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <div className="mt-0.5">ℹ️</div>
              <p>Ваш тренер получит уведомление о заморозке абонемента.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleFreeze}
                disabled={!isValid || processing}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Обработка...' : 'Заморозить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
