import React, { useState, useEffect, useCallback } from 'react';
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
  ShieldCheck,
  Plus,
  Percent
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paymentsApi } from '@/functions/axios/axiosFunctions';
import type { Club } from '../ClubsPage';
import type { RegisteredCard } from '@/functions/axios/responses';

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
  effectivePrice?: number;
  discountPercent?: number;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error' | 'pending';

export const PurchaseMembershipModal: React.FC<PurchaseMembershipModalProps> = ({
  club,
  plan,
  effectivePrice,
  discountPercent,
  onClose,
}) => {
  const displayPrice = effectivePrice ?? plan.price;
  const hasDiscount = effectivePrice !== undefined && effectivePrice < plan.price;
  const { t } = useI18n();
  const navigate = useNavigate();
  
  // Saved cards state
  const [savedCards, setSavedCards] = useState<RegisteredCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [loadingCards, setLoadingCards] = useState(true);
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Load saved cards on mount
  const loadSavedCards = useCallback(async () => {
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      
      const response = await paymentsApi.cards.getAll(token);
      const cards = response.data.cards || [];
      setSavedCards(cards);
      
      // Auto-select first active card
      const activeCard = cards.find((c: RegisteredCard) => c.is_active);
      if (activeCard) {
        setSelectedCardId(activeCard.card_id);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    loadSavedCards();
  }, [loadSavedCards]);

  // Detect card type from PAN
  const getCardType = (pan: string | null): 'visa' | 'mastercard' | 'other' => {
    if (!pan) return 'other';
    const firstDigit = pan[0];
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5' || firstDigit === '2') return 'mastercard';
    return 'other';
  };

  // Format masked PAN for display
  const formatPan = (pan: string | null) => {
    if (!pan) return '•••• •••• •••• ••••';
    return pan.replace(/(.{4})/g, '$1 ').trim();
  };

  // Handle OneClick payment with saved card
  const handleOneClickPayment = async () => {
    if (!selectedCardId) return;

    setPaymentStatus('processing');
    setPaymentError(null);

    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;

      // Call OneClick API - no redirect needed!
      const response = await paymentsApi.gateway.payWithCard({
        club_id: club.id,
        tariff_id: plan.id,
        card_id: selectedCardId,
      }, token);

      if (response.data.status === 'paid') {
        setPaymentStatus('success');
        setShowSuccessAnimation(true);
      } else if (response.data.status === 'processing' || response.data.status === 'awaiting_confirmation') {
        // Payment is being processed (MID_DISABLED, PROCESSING, etc.)
        // Redirect to callback page for polling
        sessionStorage.setItem('pending_payment_id', String(response.data.payment_id));
        sessionStorage.setItem('payment_return_url', window.location.href);
        
        // Show message briefly then redirect
        setPaymentError(response.data.message || 'Платёж обрабатывается...');
        setPaymentStatus('pending');
        
        setTimeout(() => {
          navigate('/payment/callback');
        }, 1500);
      } else if (response.data.status === 'failed') {
        throw new Error(response.data.message || 'Payment failed');
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('OneClick payment error:', error);
      const { getErrorMessage } = await import('@/lib/utils/errorHandler');
      setPaymentError(getErrorMessage(error, 'Ошибка оплаты'));
      setPaymentStatus('error');
    }
  };

  // Handle new card payment (redirect to CNP E-COM page)
  const handleNewCardPayment = async () => {
    setPaymentStatus('processing');
    setPaymentError(null);

    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;

      // Return URL points to payment callback page
      const paymentCallbackUrl = `${window.location.origin}/payment/callback`;
      
      const gatewayResponse = await paymentsApi.gateway.initiate({
        club_id: club.id,
        tariff_id: plan.id,
        payment_method: 'card',
      }, token, paymentCallbackUrl);

      if (gatewayResponse.data.requires_redirect && gatewayResponse.data.redirect_url) {
        // Store payment ID for callback handling
        sessionStorage.setItem('pending_payment_id', String(gatewayResponse.data.payment_id));
        sessionStorage.setItem('payment_return_url', window.location.href);
        
        // Navigate to CNP payment page (E-COM with amount shown)
        window.location.href = gatewayResponse.data.redirect_url;
        return;
      } else if (gatewayResponse.data.status === 'paid') {
        setPaymentStatus('success');
        setShowSuccessAnimation(true);
        return;
      } else {
        throw new Error('Failed to get payment redirect URL');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const { getErrorMessage } = await import('@/lib/utils/errorHandler');
      setPaymentError(getErrorMessage(error, 'Ошибка оплаты'));
      setPaymentStatus('error');
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
                <p className="text-lg font-bold text-emerald-600">{formatPrice(displayPrice)}</p>
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
              <div className="text-right">
                {hasDiscount ? (
                  <>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm text-gray-400 line-through">{formatPrice(plan.price)}</span>
                      {discountPercent && (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-md flex items-center gap-0.5">
                          <Percent size={10} />
                          -{discountPercent}%
                        </span>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-emerald-600">{formatPrice(displayPrice)}</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-blue-600">{formatPrice(displayPrice)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Способ оплаты</p>
            </div>

            {loadingCards ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {/* Saved Cards List */}
                {savedCards.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {savedCards.map((card) => (
                      <button
                        key={card.card_id}
                        onClick={() => setSelectedCardId(card.card_id)}
                        disabled={paymentStatus === 'processing'}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          selectedCardId === card.card_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Card type icon */}
                        <div className={`w-10 h-6 rounded flex items-center justify-center text-xs font-bold
                          ${getCardType(card.pan_masked) === 'visa' ? 'bg-blue-600 text-white' : 
                            getCardType(card.pan_masked) === 'mastercard' ? 'bg-orange-500 text-white' : 
                            'bg-gray-400 text-white'}`}
                        >
                          {getCardType(card.pan_masked) === 'visa' ? 'VISA' : 
                           getCardType(card.pan_masked) === 'mastercard' ? 'MC' : 'CARD'}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-mono text-sm text-gray-900">{formatPan(card.pan_masked)}</p>
                          {card.card_holder && (
                            <p className="text-xs text-gray-500">{card.card_holder}</p>
                          )}
                        </div>
                        {selectedCardId === card.card_id && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Add New Card Option */}
                <button
                  onClick={() => setSelectedCardId(null)}
                  disabled={paymentStatus === 'processing'}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all ${
                    selectedCardId === null && savedCards.length > 0
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Plus size={20} className="text-gray-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">Оплатить новой картой</p>
                    <p className="text-xs text-gray-500">Вы будете перенаправлены на защищённую страницу оплаты</p>
                  </div>
                  {selectedCardId === null && savedCards.length > 0 && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 py-3">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span className="text-xs text-gray-500">Данные защищены шифрованием SSL</span>
                </div>
              </>
            )}
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
              onClick={selectedCardId ? handleOneClickPayment : handleNewCardPayment}
              disabled={paymentStatus === 'processing' || loadingCards}
              className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {paymentStatus === 'processing' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              {selectedCardId ? `Оплатить ${formatPrice(displayPrice)}` : 'Перейти к оплате'}
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
