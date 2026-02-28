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
          
          return (
            <div key={session.id} className="pl-4 relative">
              <div className={`py-4 pr-4 ${index !== sessions.length - 1 ? 'border-b border-[#E5E5EA]' : ''}`}>
                
                {/* Date & Time (Caption) */}
                <p className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-2">
                  {dateLabel.toUpperCase()} · {timeLabel}
                </p>
                
                {/* Title (Large Semibold) */}
                <h3 className="text-[22px] font-semibold text-[#000000] leading-tight mb-1 tracking-tight">
                  {session.section_name}
                </h3>

                {/* Subtitle (Light/Regular) */}
                {session.group_name && (
                  <p className="text-[17px] font-normal text-[#000000] mb-1">
                    {session.group_name}
                  </p>
                )}

                {/* Coach & Info (Light Gray) */}
                <p className="text-[15px] font-normal text-[#8E8E93] mb-3">
                  Тренер: {session.coach_name || 'Не указан'}
                </p>
                
                {/* Status Text (if full or low spots) */}
                {spotsLeft !== null && spotsLeft <= 5 && !session.is_booked && (
                  <p className={`text-[15px] mb-3 font-medium ${spotsLeft === 0 ? 'text-[#FF3B30]' : 'text-[#FF9500]'}`}>
                    {spotsLeft === 0 ? t('home.sessions.status.full') : `Осталось ${spotsLeft} места`}
                  </p>
                )}

                {/* Action CTA as text link */}
                <div className="flex items-center">
                  {session.is_booked ? (
                    <div className="flex items-center gap-1.5 text-[#8E8E93]">
                      <span className="text-[17px] font-medium">Вы записаны</span>
                      <CheckCircle size={20} className="text-[#34C759] fill-[#34C759]/20" />
                    </div>
                  ) : canBook ? (
                    <button
                      onClick={() => handleBookSession(session.id)}
                      className="text-[17px] text-[#007AFF] font-medium active:opacity-60 transition-opacity flex items-center gap-1"
                    >
                      {t('home.sessions.book')}
                      <span className="font-normal">→</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
