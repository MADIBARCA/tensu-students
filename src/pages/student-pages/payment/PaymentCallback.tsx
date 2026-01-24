import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/i18n/i18n';
import { Check, AlertCircle, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { paymentsApi } from '@/functions/axios/axiosFunctions';

type CallbackStatus = 'loading' | 'success' | 'error';

// Telegram Mini App deep link - update this with your actual bot/app name
const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'tensu_students_test_bot';
const TELEGRAM_APP_NAME = import.meta.env.VITE_TELEGRAM_APP_NAME || 'tensu_students_test';

/**
 * Check if we're running inside Telegram Mini App
 */
function isInsideTelegram(): boolean {
  return !!window.Telegram?.WebApp?.initData;
}

/**
 * Generate Telegram Mini App deep link with startapp parameter
 */
function getTelegramDeepLink(paymentId?: string): string {
  if (paymentId) {
    return `https://t.me/${TELEGRAM_BOT_USERNAME}/${TELEGRAM_APP_NAME}?startapp=payment_${paymentId}`;
  }
  return `https://t.me/${TELEGRAM_BOT_USERNAME}/${TELEGRAM_APP_NAME}`;
}

/**
 * Payment Callback Page
 * 
 * This page handles the return from the CNP payment gateway.
 * After the user completes payment on the gateway page, they are redirected
 * here. We then check the payment status with our backend.
 * 
 * Works in two modes:
 * 1. Inside Telegram Mini App - shows result and navigates within the app
 * 2. In browser (after CNP redirect) - shows result and offers to open Telegram
 */
export const PaymentCallback: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [message, setMessage] = useState('');
  const [isInTelegram] = useState(() => isInsideTelegram());
  const [paymentDetails, setPaymentDetails] = useState<{
    payment_id: number;
    amount?: number;
    currency?: string;
  } | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;

        // Get payment ID from URL params or session storage
        let paymentId = searchParams.get('payment_id');
        if (!paymentId) {
          paymentId = sessionStorage.getItem('pending_payment_id');
        }

        // Get CNP callback parameters (userId and cardId come from successful card registration)
        const cnpUserId = searchParams.get('userId');
        const cnpCardId = searchParams.get('cardId');
        // customerReference is also returned but we use payment_id instead

        // If we have CNP card registration data, sync it with backend
        if (cnpUserId && cnpCardId && token) {
          try {
            await paymentsApi.cards.sync(
              parseInt(cnpUserId),
              parseInt(cnpCardId),
              token
            );
            console.log('Card synced successfully:', { cnpUserId, cnpCardId });
          } catch (syncError) {
            console.error('Error syncing card:', syncError);
            // Don't fail the whole flow if sync fails
          }
        }

        if (!paymentId) {
          // If no payment_id but we have card data, it might be just card registration
          if (cnpUserId && cnpCardId) {
            setStatus('success');
            setMessage('Карта успешно привязана!');
            return;
          }
          setStatus('error');
          setMessage('Payment information not found');
          return;
        }

        // Check payment status with backend
        const response = await paymentsApi.gateway.getStatus(
          parseInt(paymentId),
          token
        );

        const paymentData = response.data;
        setPaymentDetails({
          payment_id: paymentData.payment_id,
          amount: paymentData.amount,
          currency: paymentData.currency,
        });

        if (paymentData.status === 'paid') {
          setStatus('success');
          setMessage(t('clubs.payment.success.description') || 'Payment successful!');
          
          // Clear session storage
          sessionStorage.removeItem('pending_payment_id');
          sessionStorage.removeItem('payment_return_url');
        } else if (paymentData.status === 'failed' || paymentData.status === 'cancelled') {
          setStatus('error');
          setMessage(t('clubs.payment.error.description') || 'Payment failed or was cancelled');
        } else if (paymentData.status === 'processing' || paymentData.status === 'pending') {
          // Payment still processing - poll for status
          // In a real app, you might want to implement polling or webhooks
          setStatus('loading');
          setMessage('Payment is being processed...');
          
          // Retry after delay
          setTimeout(checkPaymentStatus, 3000);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
        setMessage(t('clubs.payment.error.generic') || 'Error checking payment status');
      }
    };

    checkPaymentStatus();
  }, [searchParams, t]);

  // Auto redirect after success (only inside Telegram)
  useEffect(() => {
    if (status === 'success' && isInTelegram) {
      const timer = setTimeout(() => {
        navigate('/student/profile');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate, isInTelegram]);

  const formatPrice = (amount: number, currency: string = 'KZT') => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl p-8 text-center shadow-lg">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="w-20 h-20 border-4 border-blue-100 rounded-full" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('clubs.payment.processing') || 'Processing payment...'}
          </h2>
          <p className="text-gray-500">
            {message || 'Please wait while we confirm your payment'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div 
          className="bg-white w-full max-w-md rounded-2xl p-6 text-center relative overflow-hidden shadow-lg"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          {/* Confetti-like decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-4 left-8 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="absolute top-8 right-12 w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="absolute top-12 left-16 w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-6 right-8 w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="absolute top-16 left-6 w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.25s' }} />
          </div>
          
          {/* Success icon */}
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
                {t('clubs.payment.success.title') || 'Payment Successful!'}
              </h2>
              <Sparkles size={20} className="text-amber-500" />
            </div>
            
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            {/* Payment summary */}
            {paymentDetails && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Payment ID</p>
                    <p className="font-medium text-gray-900">#{paymentDetails.payment_id}</p>
                  </div>
                  {paymentDetails.amount && (
                    <p className="text-lg font-bold text-emerald-600">
                      {formatPrice(paymentDetails.amount, paymentDetails.currency)}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {isInTelegram ? (
              <>
                <button
                  onClick={() => navigate('/student/profile')}
                  className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg shadow-blue-200"
                >
                  {t('clubs.payment.success.button') || 'Go to Profile'}
                </button>
                
                <p className="text-sm text-gray-400 mt-3 flex items-center justify-center gap-1">
                  <Loader2 size={14} className="animate-spin" />
                  {t('clubs.payment.success.redirect') || 'Redirecting in 5 seconds...'}
                </p>
              </>
            ) : (
              <>
                <a
                  href={getTelegramDeepLink(paymentDetails?.payment_id?.toString())}
                  className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <ExternalLink size={18} />
                  Открыть в Telegram
                </a>
                
                <p className="text-sm text-gray-500 mt-3">
                  Нажмите кнопку выше, чтобы вернуться в приложение
                </p>
              </>
            )}
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

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 text-center shadow-lg">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t('clubs.payment.error.title') || 'Payment Error'}
        </h2>
        <p className="text-gray-600 mb-6">
          {message || t('clubs.payment.error.description') || 'There was an error processing your payment.'}
        </p>
        
        {isInTelegram ? (
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/student/clubs')}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              {t('clubs.payment.cancel') || 'Back to Clubs'}
            </button>
            <button
              onClick={() => {
                // Try to go back to the original page
                const returnUrl = sessionStorage.getItem('payment_return_url');
                if (returnUrl) {
                  window.location.href = returnUrl;
                } else {
                  navigate('/student/clubs');
                }
              }}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
            >
              {t('clubs.payment.error.retry') || 'Try Again'}
            </button>
          </div>
        ) : (
          <a
            href={getTelegramDeepLink()}
            className="w-full px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            <ExternalLink size={18} />
            Вернуться в Telegram
          </a>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
