import React, { useState } from 'react';
import { X, Snowflake, Calendar } from 'lucide-react';
import { membershipsApi } from '@/functions/axios/axiosFunctions';

interface FreezeMembershipModalProps {
  membership: {
    id: number;
    status: string;
    freeze_days_available?: number;
    freeze_days_used?: number;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export const FreezeMembershipModal: React.FC<FreezeMembershipModalProps> = ({
  membership,
  onClose,
  onSuccess,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const freezeDays = calculateFreezeDays();
  const isValid = freezeDays >= 1 && freezeDays <= 30 && freezeDays <= freezeDaysAvailable;

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
        tg.showAlert('Абонемент успешно заморожен');
      }
      
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error('Freeze failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при заморозке абонемента';
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
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при разморозке абонемента';
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

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
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Абонемент заморожен. Вы можете разморозить его в любое время.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleUnfreeze}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {processing ? 'Обработка...' : 'Разморозить'}
              </button>
            </div>
          </div>
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
                min={today}
                className="w-full border border-gray-200 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата окончания заморозки
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
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
                    : freezeDays > 30
                    ? 'Максимальный срок заморозки: 30 дней'
                    : freezeDays > freezeDaysAvailable
                    ? `Доступно только ${freezeDaysAvailable} дней`
                    : 'Минимальный срок заморозки: 1 день'}
                </p>
              </div>
            )}

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
