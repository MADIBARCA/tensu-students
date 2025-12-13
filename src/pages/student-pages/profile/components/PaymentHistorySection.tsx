import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { ChevronRight, CreditCard, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paymentsApi } from '@/functions/axios/axiosFunctions';
import type { PaymentResponse, PaymentStatus } from '@/functions/axios/responses';

interface Payment {
  id: number;
  club_name: string | null;
  amount: number;
  payment_date: string | null;
  status: PaymentStatus;
  payment_method?: string | null;
}

export const PaymentHistorySection: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        const response = await paymentsApi.getHistory(token, 1, 5);
        
        // Map API response to component format
        const mappedPayments: Payment[] = response.data.payments.map((p: PaymentResponse) => ({
          id: p.id,
          club_name: p.club_name,
          amount: p.amount,
          payment_date: p.payment_date || p.created_at,
          status: p.status,
          payment_method: p.payment_method,
        }));
        
        setPayments(mappedPayments);
      } catch (error) {
        console.error('Failed to load payments:', error);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: t('payments.status.paid'),
      pending: t('payments.status.pending'),
      failed: t('payments.status.failed'),
      refunded: 'Возвращён',
      cancelled: 'Отменён',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'text-green-600',
      pending: 'text-yellow-600',
      failed: 'text-red-600',
      refunded: 'text-blue-600',
      cancelled: 'text-gray-600',
    };
    return colors[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.payments')} />
        <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.payments')} />
        <Card className="text-center py-8">
          <p className="text-gray-600">{t('payments.no.payments')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <SectionHeader title="История платежей" />
        <button
          onClick={() => navigate('/student/payments')}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          {t('payments.view.all')}
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard size={16} className="text-gray-400" />
                  <h4 className="font-medium text-gray-900">{payment.club_name || 'Клуб'}</h4>
                </div>
                {payment.payment_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>{formatDate(payment.payment_date)}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatAmount(payment.amount)}</p>
                <p className={`text-xs ${getStatusColor(payment.status)}`}>
                  {getStatusLabel(payment.status)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
