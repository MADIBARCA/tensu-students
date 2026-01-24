import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/i18n';
import { 
  X, 
  CreditCard, 
  Check, 
  AlertCircle, 
  Loader2, 
  Lock, 
  Calendar, 
  Building2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paymentsApi } from '@/functions/axios/axiosFunctions';
import type { Club } from '../ClubsPage';

interface MembershipPlan {
  id: number;
  name: string;
  type: string;
  price: number;
  duration_days: number | null;
  description?: string | null;
  features: string[];
}

interface PurchaseMembershipModalProps {
  club: Club;
  plan: MembershipPlan;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error' | 'pending';

export const PurchaseMembershipModal: React.FC<PurchaseMembershipModalProps> = ({
  club,
  plan,
  onClose,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [customerName, setCustomerName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  // Detect card brand based on number
  const getCardBrand = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
    if (cleaned.startsWith('62')) return 'unionpay';
    return null;
  };

  const cardBrand = getCardBrand(cardNumber);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = t('clubs.payment.errors.name');
    }

    const cardDigits = cardNumber.replace(/\s/g, '');
    if (cardDigits.length !== 16) {
      newErrors.cardNumber = t('clubs.payment.errors.card');
    }

    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear() % 100;
    
    if (!month || !year || parseInt(month) < 1 || parseInt(month) > 12) {
      newErrors.expiryDate = t('clubs.payment.errors.expiry');
    } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      newErrors.expiryDate = t('clubs.payment.errors.expiryPast');
    }

    if (cvv.length !== 3) {
      newErrors.cvv = t('clubs.payment.errors.cvv');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return (
      customerName.trim() &&
      cardNumber.replace(/\s/g, '').length === 16 &&
      expiryDate.length === 5 &&
      cvv.length === 3
    );
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setPaymentStatus('processing');
    setPaymentError(null);

    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;

      // Check if we should use the real gateway or mock flow
      const useRealGateway = import.meta.env.VITE_USE_REAL_PAYMENT === 'true';

      if (useRealGateway) {
        // Real CNP Gateway flow - redirect to payment page
        const currentUrl = window.location.href;
        const returnUrl = `${window.location.origin}/payment/callback`;
        
        const gatewayResponse = await paymentsApi.gateway.initiate({
          club_id: club.id,
          tariff_id: plan.id,
          payment_method: 'card',
        }, token, returnUrl);

        if (gatewayResponse.data.requires_redirect && gatewayResponse.data.redirect_url) {
          // Store payment ID for callback handling
          sessionStorage.setItem('pending_payment_id', String(gatewayResponse.data.payment_id));
          sessionStorage.setItem('payment_return_url', currentUrl);
          
          const redirectUrl = gatewayResponse.data.redirect_url;
          
          // CNP gateway doesn't allow iframe embedding (X-Frame-Options: sameorigin)
          // Check if we're in Telegram WebApp and openLink method exists
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tgAny = tg as any;
          if (tgAny?.openLink) {
            // Telegram WebApp - use openLink to open in external browser
            // This is the only reliable way to open external payment pages from Telegram
            tgAny.openLink(redirectUrl);
            // Show message that user needs to complete payment in browser
            setPaymentStatus('pending');
            setPaymentError('Откройте браузер для завершения оплаты');
          } else {
            // Regular browser - direct navigation
            window.location.href = redirectUrl;
          }
          return;
        } else if (gatewayResponse.data.status === 'paid') {
          // Payment already completed (shouldn't happen normally)
          setPaymentStatus('success');
          setShowSuccessAnimation(true);
          return;
        } else {
          throw new Error('Failed to get payment redirect URL');
        }
      } else {
        // Mock payment flow (for testing)
        // Step 1: Initiate payment - creates payment record with pending status
        const initiateResponse = await paymentsApi.initiate({
          club_id: club.id,
          tariff_id: plan.id,
          payment_method: 'card',
        }, token);

        const paymentId = initiateResponse.data.payment_id;

        // Step 2: Simulate card processing delay (mock)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Step 3: Complete payment - marks as paid and creates enrollment
        const completeResponse = await paymentsApi.complete(paymentId, token);

        if (completeResponse.data.success) {
          setPaymentStatus('success');
          setShowSuccessAnimation(true);
        } else {
          throw new Error(completeResponse.data.message || 'Payment completion failed');
        }
      }
    } catch (error: unknown) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      
      // Extract error message from backend response
      const { getErrorMessage } = await import('@/lib/utils/errorHandler');
      const errorMessage = getErrorMessage(error, t('clubs.payment.error.generic') || 'Ошибка при оплате');
      setPaymentError(errorMessage);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPlanDuration = (plan: MembershipPlan) => {
    if (plan.duration_days) {
      if (plan.duration_days === 30) return t('clubs.details.duration.month');
      if (plan.duration_days === 90) return t('clubs.details.duration.quarter');
      if (plan.duration_days === 180) return t('clubs.details.duration.halfYear');
      if (plan.duration_days === 365) return t('clubs.details.duration.year');
      return t('clubs.details.duration.days', { days: plan.duration_days });
    }
    return plan.type;
  };

  // Auto redirect after success
  useEffect(() => {
    if (paymentStatus === 'success') {
      const timer = setTimeout(() => {
        navigate('/student/profile');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, navigate]);

  // Success Screen with celebration
  if (paymentStatus === 'success') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div 
          className="bg-white w-full max-w-md rounded-2xl p-6 text-center relative overflow-hidden"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          {/* Confetti-like decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {showSuccessAnimation && (
              <>
                <div className="absolute top-4 left-8 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="absolute top-8 right-12 w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="absolute top-12 left-16 w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="absolute top-6 right-8 w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="absolute top-16 left-6 w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.25s' }} />
                <div className="absolute top-20 right-16 w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </>
            )}
          </div>
          
          {/* Success icon with animation */}
          <div 
            className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200"
            style={{ animation: 'scaleIn 0.5s ease-out' }}
          >
            <Check size={40} className="text-white" strokeWidth={3} />
          </div>
          
          <div style={{ animation: 'slideUp 0.4s ease-out 0.2s both' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles size={20} className="text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900">
                {t('clubs.payment.success.title')}
              </h2>
              <Sparkles size={20} className="text-amber-500" />
            </div>
            
            <p className="text-gray-600 mb-6">
              {t('clubs.payment.success.description')}
            </p>

            {/* Purchase summary */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('clubs.payment.club')}</p>
                  <p className="font-semibold text-gray-900">{club.name}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">{t('clubs.payment.membership')}</p>
                  <p className="font-medium text-gray-900">{plan.name}</p>
                </div>
                <p className="text-lg font-bold text-emerald-600">{formatPrice(plan.price)}</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/student/profile')}
              className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg shadow-blue-200"
            >
              {t('clubs.payment.success.button')}
            </button>
            
            <p className="text-sm text-gray-400 mt-3 flex items-center justify-center gap-1">
              <Loader2 size={14} className="animate-spin" />
              {t('clubs.payment.success.redirect')}
            </p>
          </div>
        </div>
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Error Screen
  if (paymentStatus === 'error') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl p-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('clubs.payment.error.title')}
          </h2>
          <p className="text-gray-600 mb-6">
            {paymentError || t('clubs.payment.error.description')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              {t('clubs.payment.cancel')}
            </button>
            <button
              onClick={() => setPaymentStatus('idle')}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
            >
              {t('clubs.payment.error.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div 
        className="bg-white w-full max-w-md rounded-2xl overflow-hidden relative shadow-2xl"
        style={{ animation: 'modalSlide 0.3s ease-out' }}
      >
        {/* Processing Overlay */}
        {paymentStatus === 'processing' && (
          <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-700 font-medium mt-4">{t('clubs.payment.processing')}</p>
            <p className="text-gray-400 text-sm mt-1">Не закрывайте это окно</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-blue-100" />
            <h2 className="text-lg font-semibold text-white">{t('clubs.payment.securePayment')}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={paymentStatus === 'processing'}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {/* Order Summary Card */}
          <div className="mb-5 p-4 bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl border border-blue-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">{t('clubs.payment.order')}</p>
            
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <CreditCard size={24} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{plan.name}</p>
                <p className="text-sm text-gray-500">{club.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-400">{getPlanDuration(plan)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-100">
              <span className="font-medium text-gray-600">{t('clubs.payment.total')}</span>
              <span className="text-2xl font-bold text-blue-600">{formatPrice(plan.price)}</span>
            </div>
          </div>

          {/* Card Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-700">{t('clubs.payment.cardInfo')}</p>
            </div>

            {/* Card Holder Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('clubs.payment.customerName')}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="IVAN IVANOV"
                className={`w-full border-2 rounded-xl p-3.5 transition-all focus:outline-none focus:ring-0 uppercase ${
                  errors.customerName 
                    ? 'border-red-300 focus:border-red-500 bg-red-50' 
                    : 'border-gray-200 focus:border-blue-500'
                }`}
                disabled={paymentStatus === 'processing'}
              />
              {errors.customerName && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.customerName}
                </p>
              )}
            </div>

            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('clubs.payment.cardNumber')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className={`w-full border-2 rounded-xl p-3.5 pr-14 transition-all focus:outline-none focus:ring-0 font-mono ${
                    errors.cardNumber 
                      ? 'border-red-300 focus:border-red-500 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  disabled={paymentStatus === 'processing'}
                />
                {/* Card brand icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cardBrand === 'visa' && (
                    <div className="text-[#1A1F71] font-bold text-lg italic">VISA</div>
                  )}
                  {cardBrand === 'mastercard' && (
                    <div className="flex">
                      <div className="w-5 h-5 bg-red-500 rounded-full -mr-2" />
                      <div className="w-5 h-5 bg-amber-400 rounded-full opacity-80" />
                    </div>
                  )}
                  {!cardBrand && cardNumber.length === 0 && (
                    <CreditCard size={20} className="text-gray-300" />
                  )}
                </div>
              </div>
              {errors.cardNumber && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.cardNumber}
                </p>
              )}
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('clubs.payment.expiry')}
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className={`w-full border-2 rounded-xl p-3.5 transition-all focus:outline-none focus:ring-0 font-mono text-center ${
                    errors.expiryDate 
                      ? 'border-red-300 focus:border-red-500 bg-red-50' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  disabled={paymentStatus === 'processing'}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.expiryDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CVV
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="•••"
                    maxLength={3}
                    className={`w-full border-2 rounded-xl p-3.5 transition-all focus:outline-none focus:ring-0 font-mono text-center ${
                      errors.cvv 
                        ? 'border-red-300 focus:border-red-500 bg-red-50' 
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                    disabled={paymentStatus === 'processing'}
                  />
                  <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
                {errors.cvv && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.cvv}
                  </p>
                )}
              </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 py-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="text-xs text-gray-500">Данные защищены шифрованием SSL</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={paymentStatus === 'processing'}
              className="flex-1 px-4 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
            >
              {t('clubs.payment.cancel')}
            </button>
            <button
              onClick={handlePayment}
              disabled={!isFormValid() || paymentStatus === 'processing'}
              className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 disabled:shadow-none flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              {t('clubs.payment.pay')}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes modalSlide {
          from {
            transform: translateY(20px);
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
