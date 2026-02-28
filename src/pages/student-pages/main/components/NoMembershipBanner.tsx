import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Flame, MapPin } from 'lucide-react';

export const NoMembershipBanner: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60"></div>
      
      <div className="flex items-start gap-4 mb-6 relative z-10">
        <div className="w-14 h-14 bg-linear-to-br from-blue-50 to-blue-100 text-[#2563EB] rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
          <Flame size={26} className="text-[#2563EB]" />
        </div>
        <div className="pt-1">
          <h3 className="text-[20px] font-extrabold text-[#111827] leading-[1.2] mb-1.5 tracking-tight">
            {t('home.noMembership.titleNew')}
          </h3>
          <p className="text-[14px] text-gray-500 leading-snug font-medium pr-2">
            {t('home.noMembership.descNew')}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2.5 relative z-10">
        <button
          onClick={() => navigate('/student/clubs')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-linear-to-r from-[#1E3A8A] to-[#2563EB] text-white rounded-[16px] hover:opacity-90 active:scale-[0.98] transition-all font-semibold text-[15px] shadow-lg shadow-blue-900/20"
        >
          {t('home.noMembership.findClub')}
          <ArrowRight size={18} />
        </button>
        <button
          onClick={() => navigate('/student/clubs')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-50/80 text-gray-700 rounded-[16px] hover:bg-gray-100 active:scale-[0.98] transition-all font-medium text-[15px]"
        >
          <MapPin size={18} className="text-gray-400" />
          {t('home.noMembership.nearby')}
        </button>
      </div>
    </div>
  );
};
