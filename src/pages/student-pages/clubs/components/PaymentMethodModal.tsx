import React, { useState, useCallback } from 'react';
import { useI18n } from '@/i18n/i18n';
import { X, QrCode, Banknote, ChevronRight, ArrowLeft, Loader2, Copy, Check } from 'lucide-react';
import { kaspiOrdersApi } from '@/functions/axios/axiosFunctions';
import type { KaspiOrderResponse } from '@/functions/axios/responses';

interface MembershipPlan {
  id: number;
  name: string;
  price: number;
}

interface PaymentMethodModalProps {
  isOpen: boolean;
  plan: MembershipPlan;
  clubId: number;
  onClose: () => void;
  onSelectCash: () => void;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  plan,
  clubId,
  onClose,
  onSelectCash,
}) => {
  const { t } = useI18n();
  const [kaspiOrder, setKaspiOrder] = useState<KaspiOrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const token = window.Telegram?.WebApp?.initData || null;

  const handleSelectKaspi = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await kaspiOrdersApi.create(
        { tariff_id: plan.id, club_id: clubId },
        token,
      );
      setKaspiOrder(response.data);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const detail = err?.response?.data?.detail || '';
      if (detail.toLowerCase().includes('уже есть активный')) {
        setErrorMsg(t('kaspi.order.error.alreadyActive'));
      } else if (detail.toLowerCase().includes('бин')) {
        setErrorMsg(t('kaspi.order.error.noBin'));
      } else {
        setErrorMsg(detail || t('kaspi.order.error.generic'));
      }
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('error');
    } finally {
      setIsLoading(false);
    }
  }, [plan, clubId, token, isLoading, t]);

  const handleCopyOrderId = useCallback(() => {
    if (!kaspiOrder) return;
    navigator.clipboard.writeText(String(kaspiOrder.order_id)).then(() => {
      setCopied(true);
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [kaspiOrder]);

  const handleBack = () => {
    setKaspiOrder(null);
    setErrorMsg('');
  };

  if (!isOpen) return null;

  // Kaspi order created — show order_id with instructions
  if (kaspiOrder) {
    return (
      <div className="fixed inset-0 z-[120] flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center px-4 pb-3 border-b border-gray-100 pt-25">
          <button
            onClick={handleBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100 transition-colors mr-3"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-base font-semibold text-gray-900">{t('kaspi.order.title')}</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex flex-col items-center text-center">
            {/* Success icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mb-6">
              <QrCode className="w-10 h-10 text-red-500" />
            </div>

            {/* Order ID — large, tappable to copy */}
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
              {t('kaspi.order.yourOrderId')}
            </p>
            <button
              onClick={handleCopyOrderId}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 active:bg-gray-100 transition-colors mb-2"
            >
              <span className="text-4xl font-bold text-gray-900 tracking-wider">
                {kaspiOrder.order_id}
              </span>
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <p className="text-xs text-gray-400 mb-6">
              {copied ? t('kaspi.order.copied') : t('kaspi.order.tapToCopy')}
            </p>

            {/* Order details */}
            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-3 text-left mb-6">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{t('kaspi.order.student')}</span>
                <span className="text-sm font-medium text-gray-900">{kaspiOrder.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{t('kaspi.order.club')}</span>
                <span className="text-sm font-medium text-gray-900">{kaspiOrder.club_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">{t('kaspi.order.tariff')}</span>
                <span className="text-sm font-medium text-gray-900">{kaspiOrder.tariff_name}</span>
              </div>
              <div className="border-t border-gray-200 my-1" />
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">{t('kaspi.order.amount')}</span>
                <span className="text-base font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
                  {kaspiOrder.amount.toLocaleString()} ₸
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left">
              <p className="text-sm font-semibold text-gray-900 mb-3">{t('kaspi.order.howToPay')}</p>
              <div className="space-y-2.5">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <p className="text-sm text-gray-600">{t('kaspi.order.step1')}</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <p className="text-sm text-gray-600">{t('kaspi.order.step2')}</p>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <p className="text-sm text-gray-600">{t('kaspi.order.step3')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="px-4 pt-4 pb-6 border-t border-gray-100" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}>
          <button
            onClick={onClose}
            className="btn-primary w-full py-3.5 text-sm font-semibold"
          >
            {t('kaspi.order.done')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center px-4 pb-3 border-b border-gray-100 pt-25">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100 transition-colors mr-3"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">{t('payment.method.title')}</h2>
      </div>

      {/* Plan info bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">{t('payment.request.plan_for')}</p>
            <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
              {plan.price.toLocaleString()} {t('payment.request.currency')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-3">
          {/* Kaspi option */}
          <button
            onClick={handleSelectKaspi}
            disabled={isLoading}
            className="w-full flex items-center p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50/50 active:bg-gray-100/50 transition-all group relative overflow-hidden disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mr-4 flex-shrink-0">
              {isLoading ? (
                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
              ) : (
                <QrCode className="w-6 h-6 text-red-500" />
              )}
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm font-semibold text-gray-900">{t('payment.method.kaspi')}</span>
              <p className="text-xs text-gray-500 mt-0.5">{t('payment.method.kaspi.desc')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0" />
          </button>

          {/* Cash / Transfer option */}
          <button
            onClick={onSelectCash}
            className="w-full flex items-center p-4 rounded-2xl border-2 bg-white hover:bg-blue-50/30 active:bg-blue-100/30 transition-all group"
            style={{ borderColor: 'rgb(var(--color-primary))' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(11,60,111,0.08), rgba(30,58,138,0.12))' }}
            >
              <Banknote className="w-6 h-6" style={{ color: 'rgb(var(--color-primary))' }} />
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm font-semibold text-gray-900">{t('payment.method.already_paid')}</span>
              <p className="text-xs text-gray-500 mt-0.5">{t('payment.method.already_paid.desc')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-500 transition-colors flex-shrink-0" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
};
