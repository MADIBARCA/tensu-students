import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { clubsApi } from '@/functions/axios/axiosFunctions';
import type { LeaderboardResponse } from '@/functions/axios/responses';

interface ClubLeaderboardProps {
  clubId: number;
}

export const ClubLeaderboard: React.FC<ClubLeaderboardProps> = ({ clubId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        const response = await clubsApi.getLeaderboard(clubId, token);
        setData(response.data);
      } catch (error) {
        console.error('Failed to load leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [clubId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={28} className="text-blue-300" />
        </div>
        <p className="text-gray-500 font-medium">Пока нет данных для рейтинга</p>
      </div>
    );
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-amber-500 bg-amber-50 border-amber-200';
      case 2: return 'text-slate-500 bg-slate-50 border-slate-200';
      case 3: return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy size={16} className="text-amber-500" />;
      case 2: return <Medal size={16} className="text-slate-500" />;
      case 3: return <Medal size={16} className="text-orange-600" />;
      default: return <span className="font-bold">{rank}</span>;
    }
  };

  const getInitials = (firstName: string, lastName: string | null) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  return (
    <div className="p-4 space-y-6 pb-10">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center justify-center gap-2">
          <Award size={20} className="text-blue-600" />
          Рейтинг посещаемости
        </h3>
        <p className="text-xs text-gray-500 mt-1">Рейтинг внутри клуба</p>
      </div>

      <div className="space-y-3">
        {data.entries.map((entry) => (
          <div 
            key={entry.student_id} 
            className={`flex items-center justify-between p-3 rounded-xl border ${getRankColor(entry.rank)} ${
              data.current_student?.student_id === entry.student_id ? 'ring-2 ring-blue-400' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium overflow-hidden shrink-0">
                {entry.photo_url ? (
                  <img src={entry.photo_url} alt={entry.first_name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(entry.first_name, entry.last_name)
                )}
              </div>
              
              <div>
                <p className={`text-sm font-semibold text-gray-900 line-clamp-1`}>
                  {entry.first_name} {entry.last_name}
                  {data.current_student?.student_id === entry.student_id && (
                    <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Вы</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-gray-900">{entry.trainings_count}</p>
              <p className="text-[10px] text-gray-500">тренировок</p>
            </div>
          </div>
        ))}
      </div>

      {data.current_student && (
        <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
          <div className="flex items-center justify-between pl-1">
            <div>
              <p className="text-sm font-medium text-blue-900">Ваш результат</p>
              <p className="text-2xl font-bold text-blue-600">#{data.current_student.rank}</p>
              <p className="text-xs text-blue-700/80 mt-1">
                из {data.total_participants} участников
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Trophy size={24} className="text-blue-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
