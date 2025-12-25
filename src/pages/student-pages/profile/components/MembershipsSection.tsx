import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { Calendar, MapPin, Users, CreditCard, Snowflake, ChevronRight } from 'lucide-react';
import { membershipsApi } from '@/functions/axios/axiosFunctions';
import type { MembershipResponse, MembershipStatus } from '@/functions/axios/responses';

interface Membership {
  id: number;
  club_name: string;
  section_name?: string | null;
  group_name?: string | null;
  training_type: 'Group' | 'Personal';
  level?: string | null;
  status: MembershipStatus;
  start_date: string;
  end_date: string;
  freeze_days_available?: number;
  freeze_days_used?: number;
}

interface MembershipsSectionProps {
  onPayment: (membership: Membership) => void;
  onFreeze: (membership: Membership) => void;
  onClubClick: (clubId: number) => void;
}

export const MembershipsSection: React.FC<MembershipsSectionProps> = ({
  onPayment,
  onFreeze,
  onClubClick,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMemberships = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        const response = await membershipsApi.getActive(token);
        
        // Map API response to component format
        const mappedMemberships: Membership[] = response.data.memberships.map((m: MembershipResponse) => ({
          id: m.id,
          club_name: m.club_name,
          section_name: m.section_name,
          group_name: m.group_name,
          training_type: m.training_type,
          level: m.level,
          status: m.status,
          start_date: m.start_date,
          end_date: m.end_date,
          freeze_days_available: m.freeze_days_available,
          freeze_days_used: m.freeze_days_used,
        }));
        
        setMemberships(mappedMemberships);
      } catch (error) {
        console.error('Failed to load memberships:', error);
        setMemberships([]);
      } finally {
        setLoading(false);
      }
    };

    loadMemberships();
  }, []);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Активен',
      frozen: 'Заморожен',
      expired: 'Истёк',
      cancelled: 'Отменён',
      new: 'Новый',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      frozen: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      new: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.memberships')} />
        <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="mb-4">
        <SectionHeader title={t('profile.memberships')} />
        <Card className="text-center py-8">
          <p className="text-gray-600 mb-4">{t('no.memberships')}</p>
          <button
            onClick={() => navigate('/student/clubs')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('find.club')}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <SectionHeader title={t('profile.memberships')} />
      <div className="space-y-3">
        {memberships.map((membership) => (
          <Card
            key={membership.id}
            onClick={() => onClubClick(membership.id)}
            className="cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{membership.club_name}</h3>
                {membership.section_name && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                    <MapPin size={14} />
                    <span>{membership.section_name}</span>
                    {membership.group_name && <span> • {membership.group_name}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={14} />
                  <span>{membership.training_type}</span>
                  {membership.level && <span> • {membership.level}</span>}
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(membership.status)}`}>
                {getStatusLabel(membership.status)}
              </span>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar size={14} />
                <span>до {formatDate(membership.end_date)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {(membership.status === 'active' || membership.status === 'new') && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPayment(membership);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <CreditCard size={16} />
                    {t('membership.pay')}
                  </button>
                  {membership.freeze_days_available && membership.freeze_days_available > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFreeze(membership);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Snowflake size={16} />
                      {t('membership.freeze')}
                    </button>
                  ) : null}
                </>
              )}
              {membership.status === 'frozen' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFreeze(membership);
                  }}
                  className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Snowflake size={16} />
                  {t('membership.unfreeze')}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
