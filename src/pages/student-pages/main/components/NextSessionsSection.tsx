import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/i18n';
import { CheckCircle, Eye, Loader2 } from 'lucide-react';
import { scheduleApi } from '@/functions/axios/axiosFunctions';
import type { SessionResponse, SessionStatus } from '@/functions/axios/responses';
import { ParticipantsModal } from '../../schedule/components/ParticipantsModal';
import type { Training } from '../../schedule/SchedulePage';

const POLL_INTERVAL = 15_000;

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
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [showParticipantsFor, setShowParticipantsFor] = useState<Session | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchSessions = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
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
      if (showLoader) setSessions([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(true);
  }, [fetchSessions]);

  useEffect(() => {
    const interval = setInterval(() => fetchSessions(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const cardWidth = el.scrollWidth / sessions.length;
    const index = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(index, sessions.length - 1));
  };

  const handleBookSession = async (sessionId: number) => {
    if (actionInProgress) return;
    setActionInProgress(sessionId);
    const tg = window.Telegram?.WebApp;
    const token = tg?.initData || null;
    
    try {
      const response = await scheduleApi.book(sessionId, token);
      if (response.data.success) {
        if (tg) tg.showAlert(response.data.message || t('home.sessions.bookingSuccess'));
      }
    } catch (error: unknown) {
      console.error('Failed to book session:', error);
      const errMsg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || t('home.sessions.bookingError');
      if (tg) tg.showAlert(errMsg);
    } finally {
      await fetchSessions(false);
      setActionInProgress(null);
    }
  };

  const handleCancelBooking = async (sessionId: number) => {
    if (actionInProgress) return;
    const tg = window.Telegram?.WebApp;
    const token = tg?.initData || null;

    const executeCancel = async () => {
      setActionInProgress(sessionId);
      try {
        const response = await scheduleApi.cancel(sessionId, token);
        if (response.data.success) {
          if (tg) tg.showAlert(response.data.message || t('schedule.cancelSuccess'));
        }
      } catch (error: any) {
        console.error('Failed to cancel booking:', error);
        const errMsg = error.response?.data?.detail || t('schedule.cancelError');
        if (tg) tg.showAlert(errMsg);
      } finally {
        await fetchSessions(false);
        setActionInProgress(null);
      }
    };

    if (tg?.showConfirm) {
      tg.showConfirm(t('schedule.cancelBooking') + '?', (confirmed: boolean) => {
        if (confirmed) executeCancel();
      });
    } else {
      if (window.confirm(t('schedule.cancelBooking') + '?')) {
        executeCancel();
      }
    }
  };

  const getTrainingFromSession = (session: Session): Training => ({
    id: session.id,
    section_name: session.section_name,
    group_name: session.group_name || null,
    trainer_name: session.coach_name,
    trainer_id: null,
    trainer_photo_url: null,
    club_id: 0,
    club_name: session.club_name,
    club_logo_url: null,
    date: session.date,
    time: session.time,
    location: session.club_address,
    max_participants: session.max_participants || null,
    current_participants: session.participants_count,
    participants: [],
    notes: session.notes || null,
    is_booked: session.is_booked,
    is_in_waitlist: false,
  });

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
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 pb-2 items-stretch"
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
              <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 relative overflow-hidden h-full flex flex-col">
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

                <div className="mt-auto pt-2">
                  {session.is_booked ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCancelBooking(session.id)}
                        disabled={actionInProgress === session.id}
                        className="text-[13px] font-medium text-red-500 hover:text-[#DC2626] active:text-[#7F1D1D] transition-colors disabled:opacity-50"
                      >
                        {actionInProgress === session.id
                          ? <Loader2 size={14} className="animate-spin inline" />
                          : t('schedule.cancelBooking')}
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => setShowParticipantsFor(session)}
                        className="flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-[#111] transition-colors"
                      >
                        <Eye size={14} />
                        <span>{t('schedule.participants.title')}</span>
                      </button>
                    </div>
                  ) : canBook ? (
                    <button
                      onClick={() => handleBookSession(session.id)}
                      disabled={actionInProgress === session.id}
                      className="w-full py-3.5 bg-[#1E3A8A] text-white rounded-[16px] font-semibold text-[15px] hover:bg-blue-900 active:scale-[0.98] transition-all shadow-sm shadow-blue-900/20 disabled:opacity-60"
                    >
                      {actionInProgress === session.id
                        ? <Loader2 size={18} className="animate-spin mx-auto" />
                        : t('home.sessions.book')}
                    </button>
                  ) : (
                    <div className="w-full py-3.5 bg-gray-50 text-gray-400 rounded-[16px] font-semibold text-[15px] text-center">
                      {t('schedule.full')}
                    </div>
                  )}
                </div>
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

      {showParticipantsFor && (
        <ParticipantsModal
          training={getTrainingFromSession(showParticipantsFor)}
          onClose={() => setShowParticipantsFor(null)}
        />
      )}
    </div>
  );
};
