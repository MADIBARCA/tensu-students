import React, { useState } from 'react';
import { X, Snowflake, MessageSquare, AlertCircle } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';

interface FreezeModalProps {
  trainingName: string;
  trainingDate: string;
  trainingTime: string;
  onClose: () => void;
  onConfirm: (note?: string) => void;
  isLoading?: boolean;
}

export const FreezeModal: React.FC<FreezeModalProps> = ({
  trainingName,
  trainingDate,
  trainingTime,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    onConfirm(note.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 px-6 pt-6 pb-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
          
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
            <Snowflake size={28} className="text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-1">
            {t('schedule.freeze.title')}
          </h2>
          <p className="text-white/80 text-sm">
            {t('schedule.freeze.subtitle')}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Training info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="font-semibold text-gray-900">{trainingName}</p>
            <p className="text-sm text-gray-600 mt-1">
              {trainingDate} • {trainingTime}
            </p>
          </div>

          {/* Info box */}
          <div className="flex gap-3 p-3 bg-blue-50 rounded-xl">
            <AlertCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              {t('schedule.freeze.info')}
            </p>
          </div>

          {/* Note input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare size={14} />
              {t('schedule.freeze.noteLabel')}
              <span className="text-gray-400 font-normal">({t('schedule.freeze.optional')})</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('schedule.freeze.notePlaceholder')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              maxLength={500}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{note.length}/500</p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Snowflake size={18} />
                {t('schedule.freeze.confirm')}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
