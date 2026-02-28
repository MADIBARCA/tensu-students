import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { useNavigate } from 'react-router-dom';

export const NoMembershipBanner: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-16 h-full">
      <div className="max-w-xs w-full">
        <h3 className="text-[28px] font-bold text-[#000000] leading-tight mb-2 tracking-tight">
          {t('home.noMembership.titleNew')}
        </h3>
        <p className="text-[17px] text-[#8E8E93] leading-snug font-normal mb-8 mx-auto">
          {t('home.noMembership.descNew')}
        </p>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/student/clubs')}
            className="w-full bg-[#000000] text-white rounded-[14px] py-[14px] font-semibold text-[17px] active:opacity-70 transition-opacity"
          >
            {t('home.noMembership.findClub')}
          </button>
          <button
            onClick={() => navigate('/student/clubs')}
            className="w-full text-[#007AFF] font-medium text-[17px] active:opacity-70 transition-opacity"
          >
            {t('home.noMembership.nearby')}
          </button>
        </div>
      </div>
    </div>
  );
};
