import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { Calendar, MapPin, Users, ChevronRight, AlertTriangle } from 'lucide-react';
import { membershipsApi } from '@/functions/axios/axiosFunctions';
import type { MembershipResponse, MembershipStatus } from '@/functions/axios/responses';

export interface Membership {
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
  freeze_days_min?: number;
  freeze_start_date?: string | null;
  freeze_end_date?: string | null;
  is_tariff_deleted?: boolean;
}

interface MembershipsSectionProps {
  onManage: (membership: Membership) => void;
}

export const MembershipsSection: React.FC<MembershipsSectionProps> = ({
  onManage,
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
          freeze_days_min: m.freeze_days_min,
          freeze_start_date: m.freeze_start_date,
          freeze_end_date: m.freeze_end_date,
          is_tariff_deleted: m.is_tariff_deleted,
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
    return t(`membership.status.${status.toLowerCase()}`) || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-[#D1FAE5] text-[#065F46]',
      frozen: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-[#FEE2E2] text-red-800',
      new: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const calculateProgress = (start: string, end: string) => {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const now = new Date().getTime();
    
    if (now <= startDate) return 0;
    if (now >= endDate) return 100;
    
    return ((now - startDate) / (endDate - startDate)) * 100;
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
            className="btn-primary px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
          
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
            onClick={() => onManage(membership)}
            className="cursor-pointer group relative overflow-hidden transition-all hover:shadow-md border border-gray-100 p-4"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-gray-900 text-lg">{membership.club_name}</h3>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-[#1E3A8A] transition-colors" />
                </div>
                {membership.section_name && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="font-medium">{membership.section_name}</span>
                    {membership.group_name && <span className="text-gray-400">• <span className="text-gray-600">{membership.group_name === 'all' ? t('membership.group.all') : membership.group_name}</span></span>}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users size={14} className="text-gray-400" />
                  <span>{membership.training_type === 'Group' ? t('membership.type.group') : membership.training_type === 'Personal' ? t('membership.type.personal') : membership.training_type}</span>
                  {membership.level && <span>• {membership.level}</span>}
                </div>
              </div>
              
              <div className="shrink-0 flex flex-col items-end">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold shadow-sm border border-black/5 ${getStatusColor(membership.status)}`}>
                  {getStatusLabel(membership.status)}
                </span>
              </div>
            </div>

            {/* Dynamic element (Progress bar for active members) */}
            {(membership.status === 'active' || membership.status === 'frozen') && (
              <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-gray-500 flex items-center gap-1.5">
                    <Calendar size={12} />
                    {t('membership.started')} {formatDate(membership.start_date)}
                  </span>
                  <span className="font-bold text-[#1E3A8A]">{t('membership.ends')} {formatDate(membership.end_date)}</span>
                </div>
                {/* Fallback simple bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1E3A8A] rounded-full opacity-80 transition-all duration-300" 
                    style={{ width: `${calculateProgress(membership.start_date, membership.end_date)}%` }} 
                  />
                </div>
              </div>
            )}

            {/* Warning banner for discontinued tariffs */}
            {membership.is_tariff_deleted && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-3">
                <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">{t('membership.tariffDiscontinued')}</p>
                  <p className="text-amber-700 text-xs mt-0.5">{t('membership.tariffDiscontinuedHint')}</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
