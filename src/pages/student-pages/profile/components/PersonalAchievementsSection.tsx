import React, { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/i18n';
import { Card } from '@/components/ui';
import { Trophy, Flame, Medal, TrendingUp } from 'lucide-react';
import { attendanceApi, clubsApi } from '@/functions/axios/axiosFunctions';
import type { AttendanceStatsResponse } from '@/functions/axios/responses';

interface PersonalRank {
  clubId: number;
  clubName: string;
  rank: number;
  total: number;
}

interface PersonalAchievementsSectionProps {
  onBestResultClick?: (clubId: number, clubName: string) => void;
}

export const PersonalAchievementsSection: React.FC<PersonalAchievementsSectionProps> = ({ onBestResultClick }) => {
  const { t } = useI18n();
  const [stats, setStats] = useState<AttendanceStatsResponse | null>(null);
  const [bestRank, setBestRank] = useState<PersonalRank | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;

        // Fetch general stats
        const statsRes = await attendanceApi.getStats(token);
        setStats(statsRes.data);

        // Fetch clubs to get best rank
        const clubIdsRes = await clubsApi.getMyClubIds(token);
        const clubIds = clubIdsRes.data;

        let currentBest: PersonalRank | null = null;

        // Fetch leaderboard for each club
        for (const clubId of clubIds) {
          try {
            const clubRes = await clubsApi.getById(clubId, token);
            const lbRes = await clubsApi.getLeaderboard(clubId, token);
            
            const currentStudent = lbRes.data.current_student;
            const total = lbRes.data.total_participants;

            if (currentStudent) {
              const rankInfo = {
                clubId: clubId,
                clubName: clubRes.data.name,
                rank: currentStudent.rank,
                total: total
              };

              // Update best rank if this is better (lower number) or if it's the first one
              if (!currentBest || rankInfo.rank < currentBest.rank) {
                currentBest = rankInfo;
              }
            }
          } catch (e) {
            console.error(`Failed to fetch leaderboard for club ${clubId}`, e);
          }
        }

        setBestRank(currentBest);

      } catch (error) {
        console.error('Failed to load achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <Card className="mb-4 p-4 flex items-center justify-center min-h-[100px]">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </Card>
    );
  }

  // If no achievements to show, don't render the section
  if (!stats && !bestRank) {
    return null;
  }

  return (
    <div className="mb-4 space-y-3">
      {/* Best Result Card */}
      {bestRank && (
        <Card
          className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
          onClick={() => onBestResultClick?.(bestRank.clubId, bestRank.clubName)}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={64} className="text-amber-600" />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2 mb-3">
              <Trophy size={16} className="text-amber-500" />
              {t('profile.achievements.bestResult')}
            </h3>
            
            <p className="text-xs font-medium text-amber-700 mb-1">{bestRank.clubName}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">#{bestRank.rank}</span>
              <span className="text-sm text-amber-800/70">{t('profile.achievements.ofTotal', { total: bestRank.total })}</span>
            </div>
            
            {bestRank.rank <= 5 && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">
                <Medal size={12} className="text-amber-600" />
                {t(bestRank.rank <= 3 ? 'profile.achievements.top3' : 'profile.achievements.top5')}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Achievements Card */}
      {stats && (stats.streak_days > 0 || stats.total_visits > 0) && (
        <Card className="p-4 bg-white border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('profile.achievements.title')}</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {stats.streak_days > 0 && (
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex flex-col items-center text-center">
                <Flame size={20} className="text-orange-500 mb-1" />
                <p className="text-lg font-bold text-orange-700">{stats.streak_days}</p>
                <p className="text-[10px] text-orange-600/80 font-medium leading-tight mt-0.5">{t('profile.achievements.streakInRow')}</p>
              </div>
            )}
            
            {stats.total_visits > 0 && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center text-center">
                <TrendingUp size={20} className="text-blue-500 mb-1" />
                <p className="text-lg font-bold text-blue-700">{stats.total_visits}</p>
                <p className="text-[10px] text-blue-600/80 font-medium leading-tight mt-0.5">{t('profile.achievements.totalVisits')}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
