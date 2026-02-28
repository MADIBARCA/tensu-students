import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/i18n';
import { CheckCircle } from 'lucide-react';
import { scheduleApi } from '@/functions/axios/axiosFunctions';
import type { SessionResponse, SessionStatus } from '@/functions/axios/responses';

interface Session {
  id: number;
  section_name: string;
  group_name?: string | null;
  coach_name: string | null;
  club_name: string | null;
  date: string;
  time: string;
  club_address: string | null;
  participants_count: number;
  max_participants?: number | null;
  notes?: string | null;
  status: SessionStatus;
  is_booked: boolean;
}

export const NextSessionsSection: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        const response = await scheduleApi.getNext(token, 3);
        
        // Map API response to component format
        const mappedSessions: Session[] = response.data.map((s: SessionResponse) => ({
          ...s,
          status: s.is_booked ? 'booked' : s.status,
          is_booked: s.is_booked,
        }));
        
        setSessions(mappedSessions);
      } catch (error) {
        console.error('Failed to load sessions:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const formatDateTime = (date: string, time: string) => {
    // Parse date string directly to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const sessionDate = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateLabel = '';
    const sessionTime = sessionDate.getTime();
    const todayTime = today.getTime();
    const tomorrowTime = tomorrow.getTime();

    if (sessionTime === todayTime) {
      dateLabel = t('home.sessions.today');
    } else if (sessionTime === tomorrowTime) {
      dateLabel = t('home.sessions.tomorrow');
    } else {
      dateLabel = sessionDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
      });
    }

    const timeLabel = time.slice(0, 5); // Format HH:MM

    return { dateLabel, timeLabel };
  };

  const handleBookSession = async (sessionId: number) => {
    const tg = window.Telegram?.WebApp;
    const token = tg?.initData || null;
    
    try {
      const response = await scheduleApi.book(sessionId, token);
      
      if (response.data.success) {
        // Update local state on success
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { 
            ...s, 
            status: 'booked' as SessionStatus,
            is_booked: true,
            participants_count: s.participants_count + 1
          } : s
        ));
      
        if (tg) tg.showAlert(response.data.message || t('home.sessions.bookingSuccess'));
      }
    } catch (error: unknown) {
      console.error('Failed to book session:', error);
      if (tg) {
        const errorMessage = error instanceof Error ? error.message : 
          (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 
          t('home.sessions.bookingError');
        tg.showAlert(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-[#8E8E93] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="px-4 pb-8">
        <p className="text-[17px] text-[#8E8E93] text-center mb-6">
          {t('home.sessions.emptyNew')}
        </p>
        <button 
          onClick={() => navigate('/student/schedule')}
          className="w-full bg-[#000000] text-white rounded-[14px] py-[14px] font-semibold text-[17px] active:opacity-70 transition-opacity"
        >
          {t('home.noMembership.findClub')}
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* List Header */}
      <div className="flex items-center justify-between px-4 mb-2">
        <h2 className="text-[20px] font-semibold text-[#000000] tracking-tight">
          {t('home.sessions.title')}
        </h2>
        <button 
          onClick={() => navigate('/student/schedule')}
          className="flex items-center text-[17px] text-[#007AFF] active:opacity-70 transition-opacity"
        >
          {t('home.sessions.viewAll')}
          <span className="ml-1 font-normal">→</span>
        </button>
      </div>

      {/* iOS List Container */}
      <div className="mt-2">
        {sessions.map((session, index) => {
          const { dateLabel, timeLabel } = formatDateTime(session.date, session.time);
          const isFull = session.status === 'full' || 
            (session.max_participants && session.participants_count >= session.max_participants);
          const canBook = !session.is_booked && !isFull;
          const spotsLeft = session.max_participants 
            ? session.max_participants - session.participants_count 
            : null;
          
          const isHero = index === 0;

          if (isHero) {
            return (
              <div key={session.id} className="px-4 mb-6">
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                  
                  {/* Status Pill Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#EFF6FF] text-[#2563EB] uppercase tracking-wider">
                      {dateLabel === t('home.sessions.today') ? 'Сегодня' : 
                       dateLabel === t('home.sessions.tomorrow') ? 'Завтра' : dateLabel}
                    </span>
                    
                    {session.is_booked && (
                      <span className="flex items-center gap-1 text-[13px] font-bold text-[#10B981]">
                        <CheckCircle size={14} /> Вы записаны
                      </span>
                    )}
                  </div>

                  <h3 className="text-[20px] font-bold text-gray-900 leading-tight mb-1 tracking-tight">
                    {session.section_name}
                  </h3>
                  
                  {session.group_name && (
                    <p className="text-[15px] font-medium text-gray-900 mb-3">{session.group_name}</p>
                  )}

                  <div className="flex flex-col gap-1 mb-5 text-[14px] text-gray-500 font-medium">
                    <p>{dateLabel}, {timeLabel}</p>
                    <p>Тренер: {session.coach_name || 'Не указан'}</p>
                    {spotsLeft !== null && spotsLeft <= 5 && !session.is_booked && (
                      <p className={`${spotsLeft === 0 ? 'text-[#EF4444]' : 'text-[#F59E0B]'} font-bold mt-1`}>
                        {spotsLeft === 0 ? t('home.sessions.status.full') : `Осталось ${spotsLeft} места`}
                      </p>
                    )}
                  </div>

                  {!session.is_booked && canBook && (
                    <button
                      onClick={() => handleBookSession(session.id)}
                      className="w-full py-3.5 bg-[#1E3A8A] text-white rounded-[16px] font-semibold text-[15px] hover:bg-blue-900 active:scale-[0.98] transition-all shadow-sm shadow-blue-900/20"
                    >
                      {t('home.sessions.book')}
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // Secondary Sessions (List style)
          return (
            <div key={session.id} className="px-4">
              <div className={`py-4 ${index !== sessions.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {dateLabel} · {timeLabel}
                    </p>
                    <h4 className="text-[16px] font-bold text-gray-900 leading-tight mb-0.5 tracking-tight">
                      {session.section_name}
                    </h4>
                    <p className="text-[14px] text-gray-500 font-medium">
                      Тренер: {session.coach_name || 'Не указан'}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center justify-end">
                    {session.is_booked ? (
                      <CheckCircle size={20} className="text-[#10B981]" />
                    ) : canBook ? (
                      <button
                        onClick={() => handleBookSession(session.id)}
                        className="text-[14px] font-bold text-[#2563EB] active:opacity-60 transition-opacity"
                      >
                        Записаться <span className="font-normal ml-0.5">→</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
