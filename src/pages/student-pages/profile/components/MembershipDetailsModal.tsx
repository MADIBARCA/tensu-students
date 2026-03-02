import React from 'react';
import { X, Calendar, MapPin, Users, ChevronRight, Snowflake, Crown } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { MembershipStatus } from '@/functions/axios/responses';

export interface MembershipDetail {
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

interface MembershipDetailsModalProps {
  membership: MembershipDetail;
  onClose: () => void;
  onFreeze: (membership: MembershipDetail) => void;
  onRenew: (membership: MembershipDetail) => void;
}

export const MembershipDetailsModal: React.FC<MembershipDetailsModalProps> = ({
  membership,
  onClose,
  onFreeze,
  onRenew,
}) => {
  const { t } = useI18n();

  const getStatusLabel = (status: string) => {
    return t(`membership.status.${status.toLowerCase()}`) || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
      frozen: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
      expired: 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20',
      cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
      new: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    };
    return colors[status] || 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#F9FAFB] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="justify-between items-center p-4 border-b border-gray-100 bg-white sm:rounded-t-2xl rounded-t-3xl sticky top-0 z-10 hidden sm:flex">
          <h2 className="text-lg font-bold text-gray-900">{t('membership.details') || 'Детали абонемента'}</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile drag handle & title */}
        <div className="sm:hidden flex flex-col items-center pt-3 pb-4 bg-white rounded-t-3xl border-b border-gray-100 sticky top-0 z-10">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mb-3" />
          <div className="w-full px-4 flex justify-between items-center">
            <h2 className="text-[17px] font-bold text-gray-900">{t('membership.details') || 'Абонемент'}</h2>
            <button 
              onClick={onClose}
              className="p-1.5 -mr-1.5 bg-gray-50 text-gray-500 rounded-full active:scale-95 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-12">
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{membership.club_name}</h3>
            {membership.section_name && (
              <p className="text-[15px] text-gray-600 mb-4 flex items-center gap-1.5">
                <MapPin size={16} className="text-gray-400" />
                {membership.section_name}
                {membership.group_name && <span className="text-gray-400">• <span className="text-gray-600">{membership.group_name === 'all' ? t('membership.group.all') : membership.group_name}</span></span>}
              </p>
            )}

            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2.5 py-1 text-[13px] font-semibold rounded-lg ${getStatusColor(membership.status)}`}>
                {membership.status === 'frozen' && <Snowflake size={12} className="inline mr-1" />}
                {getStatusLabel(membership.status)}
              </span>
              {membership.status === 'frozen' && membership.freeze_end_date && (
                <span className="text-[13px] font-medium text-blue-600">
                  до {formatDate(membership.freeze_end_date)}
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-500 flex items-center gap-1.5"><Calendar size={14}/> {t('membership.started')}</span>
                <span className="font-medium text-gray-900">{formatDate(membership.start_date)}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-500 flex items-center gap-1.5"><Calendar size={14}/> {t('membership.ends')}</span>
                <span className="font-medium text-gray-900">{formatDate(membership.end_date)}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] pt-1">
                <span className="text-gray-500 flex items-center gap-1.5"><Users size={14}/> {t('membership.type')}</span>
                <span className="font-medium text-gray-900">
                  {membership.training_type === 'Group' ? t('membership.type.group') : membership.training_type === 'Personal' ? t('membership.type.personal') : membership.training_type}
                  {membership.level && ` • ${membership.level}`}
                </span>
              </div>
            </div>
          </div>

          {/* Management Block (iOS Settings Style) */}
          {(membership.status === 'active' || membership.status === 'frozen' || membership.status === 'new') && (
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 pl-3 mb-2">
                {t('membership.management') || 'Управление'}
              </h3>
              
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                {/* Renew Button */}
                <button
                  onClick={() => onRenew(membership)}
                  className="w-full flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Crown size={18} className="text-blue-600" />
                    </div>
                    <span className="text-[16px] font-medium text-gray-900">
                      {t('membership.renew') || 'Продлить'}
                    </span>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                </button>

                {/* Separator */}
                <div className="h-px bg-gray-100 ml-12" />

                {/* Freeze Button / Unfreeze Button */}
                {membership.status === 'frozen' ? (
                   <button
                    onClick={() => onFreeze(membership)}
                    className="w-full flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                        <Snowflake size={18} className="text-blue-600" />
                      </div>
                      <span className="text-[16px] font-medium text-gray-900">
                        {t('membership.unfreeze') || 'Разморозить'}
                      </span>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </button>
                ) : (
                  (!membership.is_tariff_deleted && membership.freeze_days_available !== undefined && membership.freeze_days_available > 0) && (
                    <button
                      onClick={() => onFreeze(membership)}
                      className="w-full flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                          <Snowflake size={18} className="text-gray-500" />
                        </div>
                        <div className="text-left flex flex-col">
                          <span className="text-[16px] font-medium text-gray-900">
                            {t('membership.freezeAction') || 'Заморозить'}
                          </span>
                          <span className="text-[12px] text-gray-500">
                            {t('membership.freezeAvailable') || 'Доступно:'} {membership.freeze_days_available} {t('membership.freezeDays') || 'дн.'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-300" />
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
