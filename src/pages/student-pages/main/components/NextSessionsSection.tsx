import React, { useState, useEffect, useRef } from 'react';
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
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        const response = await scheduleApi.getNext(token, 20);
        
        const todayStr = new Date().toISOString().split('T')[0];

        const mappedSessions: Session[] = response.data
          .map((s: SessionResponse) => ({
            ...s,
            status: s.is_booked ? 'booked' : s.status,
            is_booked: s.is_booked,
          }))
          .filter((s: Session) => s.date === todayStr);
        
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

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.scrollWidth / sessions.length;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, sessions.length - 1));
  };

  const handleBookSession = async (sessionId: number) => {
    const tg = window.Telegram?.WebApp;
    const token = tg?.initData || null;
    
    try {
      const response = await scheduleApi.book(sessionId, token);
      
      if (response.data.success) {
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
        <div className="flex items-center justify-between mb-4">
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
        <p className="text-[15px] text-[#8E8E93] text-center py-6">
          {t('home.sessions.emptyNew')}
        </p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-4 mb-3">
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

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {sessions.map((session) => {
          const timeLabel = session.time.slice(0, 5);
          const isFull = session.status === 'full' || 
            (session.max_participants && session.participants_count >= session.max_participants);
          const canBook = !session.is_booked && !isFull;
          const spotsLeft = session.max_participants 
            ? session.max_participants - session.participants_count 
            : null;

          return (
            <div
              key={session.id}
              className="snap-center shrink-0"
              style={{ width: sessions.length === 1 ? '100%' : '85%' }}
            >
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#EFF6FF] text-[#2563EB] uppercase tracking-wider">
                    {t('home.sessions.today')}
                  </span>
                  
                  {session.is_booked && (
                    <span className="flex items-center gap-1 text-[13px] font-bold text-[#10B981]">
                      <CheckCircle size={14} /> {t('home.sessions.youAreBooked')}
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
                  <p>{t('home.sessions.today')}, {timeLabel}</p>
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
        })}
      </div>

      {sessions.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {sessions.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? 'w-6 bg-[#2563EB]'
                  : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
