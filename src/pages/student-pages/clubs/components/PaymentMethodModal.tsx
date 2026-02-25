import React, { useState } from 'react';
import { useI18n } from '@/i18n/i18n';
import { X, QrCode, Banknote, ChevronRight, ArrowLeft, Construction } from 'lucide-react';

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
  onClose,
  onSelectCash,
}) => {
  const { t } = useI18n();
  const [showKaspiSoon, setShowKaspiSoon] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-100" style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}>
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
        {!showKaspiSoon ? (
          <div className="space-y-3">
            {/* Kaspi QR option */}
            <button
              onClick={() => setShowKaspiSoon(true)}
              className="w-full flex items-center p-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50/50 active:bg-gray-100/50 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mr-4 flex-shrink-0">
                <QrCode className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{t('payment.method.kaspi_qr')}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                    {t('payment.method.kaspi_qr.soon')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{t('payment.method.kaspi_qr.desc')}</p>
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
        ) : (
          /* Kaspi QR Coming Soon view */
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center mb-6">
              <Construction className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {t('payment.method.coming_soon')}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[280px]">
              {t('payment.method.coming_soon.text')}
            </p>
            <button
              onClick={() => setShowKaspiSoon(false)}
              className="mt-8 flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
              style={{ color: 'rgb(var(--color-primary))' }}
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
