import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';

export const NoMembershipBanner: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="px-4">
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <h3 className="text-[20px] font-bold text-gray-900 leading-tight mb-2 tracking-tight">
          {t('home.noMembership.titleNew')}
        </h3>
        <p className="text-[15px] text-gray-500 leading-snug font-medium mb-6">
          {t('home.noMembership.descNew')}
        </p>
        
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => navigate('/student/clubs')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1E3A8A] text-white rounded-[16px] hover:bg-blue-900 active:scale-[0.98] transition-all font-semibold text-[15px] shadow-sm shadow-blue-900/20"
          >
            {t('home.noMembership.findClub')}
            <ArrowRight size={18} />
          </button>
          
          <button
            onClick={() => navigate('/student/clubs')}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-50 text-gray-600 rounded-[16px] hover:bg-gray-100 active:scale-[0.98] transition-all font-medium text-[14px]"
          >
            <MapPin size={16} className="text-gray-400" />
            {t('home.noMembership.nearby')}
          </button>
        </div>
      </div>
    </div>
  );
};
