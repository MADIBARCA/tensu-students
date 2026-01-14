import React, { useState } from 'react';
import { useI18n } from '@/i18n/i18n';
import { 
  X, 
  Tag, 
  Percent, 
  MessageSquare, 
  Loader2, 
  CheckCircle, 
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { priceRequestsApi } from '@/functions/axios/axiosFunctions';

interface MembershipPlan {
  id: number;
  name: string;
  price: number;
  duration_days: number | null;
}

interface RequestPriceModalProps {
  clubId: number;
  clubName: string;
  plan: MembershipPlan;
  onClose: () => void;
  onSuccess: () => void;
}

const DISCOUNT_REASONS = [
  { key: 'female_discount', labelKey: 'clubs.priceRequest.reasons.female' },
  { key: 'family_member', labelKey: 'clubs.priceRequest.reasons.family' },
  { key: 'student_discount', labelKey: 'clubs.priceRequest.reasons.student' },
  { key: 'referral', labelKey: 'clubs.priceRequest.reasons.referral' },
  { key: 'loyal_customer', labelKey: 'clubs.priceRequest.reasons.loyal' },
  { key: 'other', labelKey: 'clubs.priceRequest.reasons.other' },
];

export const RequestPriceModal: React.FC<RequestPriceModalProps> = ({
  clubId,
  clubName,
  plan,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();
  
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [suggestPrice, setSuggestPrice] = useState(false);
  const [requestedPrice, setRequestedPrice] = useState<string>('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePriceChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setRequestedPrice(numericValue);
  };

  const isValid = () => {
    if (!selectedReason) return false;
    if (selectedReason === 'other' && !customReason.trim()) return false;
    if (suggestPrice && (!requestedPrice || parseInt(requestedPrice) >= plan.price)) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!isValid()) return;

    setSubmitting(true);
    setError(null);

    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;

      const reasonText = selectedReason === 'other' 
        ? customReason.trim() 
        : t(`clubs.priceRequest.reasons.${selectedReason?.replace('_discount', '')}`);

      await priceRequestsApi.create({
        club_id: clubId,
        tariff_id: plan.id,
        reason: reasonText,
        requested_price: suggestPrice && requestedPrice ? parseInt(requestedPrice) : undefined,
        message: message.trim() || undefined,
      }, token);

      setSuccess(true);
      
      // Auto close after success
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: unknown) {
      console.error('Error creating price request:', err);
      const errorResponse = err as { response?: { data?: { detail?: string } } };
      setError(errorResponse.response?.data?.detail || t('clubs.priceRequest.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div 
          className="bg-white w-full max-w-sm rounded-2xl p-6 text-center"
          style={{ animation: 'scaleIn 0.3s ease-out' }}
        >
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {t('clubs.priceRequest.success.title')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('clubs.priceRequest.success.description')}
          </p>
        </div>
        <style>{`
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center">
      <div 
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Tag size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {t('clubs.priceRequest.title')}
              </h2>
              <p className="text-xs text-white/80">{clubName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Tariff info */}
          <div className="p-4 bg-gradient-to-br from-gray-50 to-violet-50/50 rounded-xl border border-violet-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('clubs.priceRequest.selectedTariff')}</p>
                <p className="font-semibold text-gray-900">{plan.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{t('clubs.priceRequest.standardPrice')}</p>
                <p className="text-xl font-bold text-violet-600">{formatPrice(plan.price)}</p>
              </div>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <HelpCircle size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              {t('clubs.priceRequest.info')}
            </p>
          </div>

          {/* Reason selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('clubs.priceRequest.selectReason')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DISCOUNT_REASONS.map((reason) => (
                <button
                  key={reason.key}
                  onClick={() => setSelectedReason(reason.key)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                    selectedReason === reason.key
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {t(reason.labelKey)}
                </button>
              ))}
            </div>
            
            {/* Custom reason input */}
            {selectedReason === 'other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t('clubs.priceRequest.customReasonPlaceholder')}
                maxLength={100}
                className="w-full mt-3 border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-violet-500"
              />
            )}
          </div>

          {/* Suggest price toggle */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Percent size={16} className="text-violet-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {t('clubs.priceRequest.suggestPrice')}
                </span>
              </div>
              <button
                onClick={() => setSuggestPrice(!suggestPrice)}
                className={`w-12 h-7 rounded-full transition-colors ${
                  suggestPrice ? 'bg-violet-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                  suggestPrice ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </label>
            
            {suggestPrice && (
              <div className="mt-4">
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={requestedPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="0"
                    className="w-full border-2 border-gray-200 rounded-xl p-3 pr-14 text-lg font-semibold focus:outline-none focus:border-violet-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    ₸
                  </span>
                </div>
                {requestedPrice && parseInt(requestedPrice) > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {t('clubs.priceRequest.discountPercent', { 
                      percent: Math.round((1 - parseInt(requestedPrice) / plan.price) * 100) 
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Additional message */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MessageSquare size={14} />
              {t('clubs.priceRequest.additionalMessage')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('clubs.priceRequest.messagePlaceholder')}
              maxLength={500}
              rows={3}
              className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={16} className="text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid() || submitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-200 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('common.sending')}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {t('clubs.priceRequest.submit')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
