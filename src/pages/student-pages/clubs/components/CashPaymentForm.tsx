import React, { useState, useCallback } from 'react';
import { useI18n } from '@/i18n/i18n';
import { ArrowLeft, Check, Banknote, ArrowLeftRight, Loader2 } from 'lucide-react';
import { paymentRequestsApi } from '@/functions/axios/axiosFunctions';
import type { PaymentRequestMethodType } from '@/functions/axios/requests';

interface MembershipPlan {
  id: number;
  name: string;
  price: number;
}

interface CashPaymentFormProps {
  isOpen: boolean;
  plan: MembershipPlan;
  clubId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const CashPaymentForm: React.FC<CashPaymentFormProps> = ({
  isOpen,
  plan,
  clubId,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();

  const today = new Date().toISOString().split('T')[0];

  const [amount, setAmount] = useState(String(plan.price));
  const [paymentDate, setPaymentDate] = useState(today);
  const [method, setMethod] = useState<PaymentRequestMethodType>('cash');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const token = window.Telegram?.WebApp?.initData || null;

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await paymentRequestsApi.submit(
        {
          club_id: clubId,
          tariff_id: plan.id,
          declared_amount: parsedAmount,
          declared_payment_date: paymentDate,
          comment: comment.trim() || undefined,
          payment_method: method,
        },
        token
      );
      setShowSuccess(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const detail = err?.response?.data?.detail || '';
      if (detail.toLowerCase().includes('already have a pending')) {
        setErrorMsg(t('payment.request.error.duplicate'));
      } else {
        setErrorMsg(t('payment.request.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, paymentDate, method, comment, plan, isSubmitting, token, t, clubId]);

  if (!isOpen) return null;

  // Success state
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[130] flex flex-col bg-white">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('payment.request.success')}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
            {t('payment.request.success.text')}
          </p>
        </div>
        <div className="px-4 pb-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)' }}>
          <button
            onClick={onSuccess}
            className="btn-primary w-full py-3.5 text-sm font-semibold"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[130] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-100" style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 active:bg-gray-100 transition-colors mr-3"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">
          {t('payment.request.title')}
        </h2>
      </div>

      {/* Plan info bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">{t('payment.request.plan_for')}</p>
            <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
          </div>
          <p className="text-lg font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
            {plan.price.toLocaleString()} {t('payment.request.currency')}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Payment Method toggle */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t('payment.request.method')}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod('cash')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                method === 'cash'
                  ? 'border-[rgb(11,60,111)] bg-blue-50/50 text-[rgb(11,60,111)]'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Banknote className="w-4 h-4" />
              {t('payment.request.method.cash')}
            </button>
            <button
              type="button"
              onClick={() => setMethod('transfer')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                method === 'transfer'
                  ? 'border-[rgb(11,60,111)] bg-blue-50/50 text-[rgb(11,60,111)]'
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              {t('payment.request.method.transfer')}
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t('payment.request.amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              className="no-spinner w-full py-3 pl-4 pr-10 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-base font-semibold text-gray-900 focus:border-[rgb(11,60,111)] focus:bg-white outline-none transition-all"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
              {t('payment.request.currency')}
            </span>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t('payment.request.date')}
          </label>
          <input
            type="date"
            className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-900 focus:border-[rgb(11,60,111)] focus:bg-white outline-none transition-all"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            max={today}
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t('payment.request.comment')}
          </label>
          <textarea
            className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 bg-gray-50/50 text-sm text-gray-900 focus:border-[rgb(11,60,111)] focus:bg-white outline-none transition-all resize-none"
            rows={2}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('payment.request.comment.placeholder')}
          />
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-medium">
              {errorMsg}
            </p>
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="px-4 py-4 border-t border-gray-100" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('payment.request.sending')}
            </>
          ) : (
            t('payment.request.submit')
          )}
        </button>
      </div>
    </div>
  );
};
