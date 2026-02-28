import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { Flame, Trophy } from 'lucide-react';

export const PersonalStatsDashboard: React.FC = () => {
  const { t } = useI18n();
  
  // Mock data for now (to be replaced by API)
  const attendedCount = 4;
  const streakWeeks = 2;

  return (
    <div className="mb-8">
      <div className="bg-linear-to-br from-[#1E3A8A] to-[#2563EB] rounded-[24px] p-5 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex flex-col gap-1.5 w-3/4">
            <div className="flex items-center gap-1.5 text-blue-100 mb-1">
              <Trophy size={14} className="text-amber-300" />
              <span className="text-[11px] font-bold tracking-wider uppercase">Твой прогресс</span>
            </div>
            <h3 className="font-extrabold text-[16px] leading-tight text-white mb-2 pr-4 shadow-sm">
              {t('home.stats.attendedThisMonth', { count: attendedCount })}
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/20 rounded-xl w-max backdrop-blur-md">
              <Flame size={14} className="text-amber-400" />
              <span className="text-[13px] font-bold text-white tracking-tight">
                {t('home.stats.streak', { weeks: streakWeeks })}
              </span>
            </div>
          </div>
          
          <div className="w-1/4 flex justify-end">
            <div className="w-16 h-16 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center backdrop-blur-sm">
              <span className="font-black text-2xl tracking-tighter shadow-sm">{attendedCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
