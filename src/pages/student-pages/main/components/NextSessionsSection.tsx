import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/i18n';
import { Ban, CheckCircle, Loader2 } from 'lucide-react';
import { scheduleApi } from '@/functions/axios/axiosFunctions';
import type { SessionResponse, SessionStatus } from '@/functions/axios/responses';
import { getTrainingLiveStatus, type LiveTrainingStatus } from '@/lib/utils/trainingStatus';
import { toLocalDateString } from '@/lib/utils/dateUtils';
import { ParticipantsModal } from '../../schedule/components/ParticipantsModal';
import { AvatarGroup } from '@/components/ui/AvatarGroup';
import type { Training } from '../../schedule/SchedulePage';
import type { ParticipantResponse } from '@/functions/axios/responses';

const POLL_INTERVAL = 15_000;

interface Session {
  id: number;
  section_name: string;
  group_name?: string | null;
  coach_name: string | null;
  club_name: string | null;
  date: string;
  time: string;
  duration_minutes: number;
  club_address: string | null;
  participants_count: number;
  max_participants?: number | null;
  participants_preview?: ParticipantResponse[];
  notes?: string | null;
  status: SessionStatus;
  is_booked: boolean;
}

export const NextSessionsSection: React.FC = () => {
  const { t, locale } = useI18n();
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
      const response = await scheduleApi.getNext(token, 30);

      const now = new Date();
      const todayStr = toLocalDateString(now);

      const allMapped: Session[] = response.data.map((s: SessionResponse) => ({
        ...s,
        date: (s.date || '').slice(0, 10),
        duration_minutes: s.duration_minutes || 60,
        status: s.is_booked ? ('booked' as SessionStatus) : s.status,
        is_booked: s.is_booked,
      }));

      console.log('[NextSessions] Raw API data count:', response.data.length);
      console.log('[NextSessions] Raw API sessions:', response.data.map((s: SessionResponse) => ({
        id: s.id, date: s.date, time: s.time, section: s.section_name, status: s.status,
        duration: s.duration_minutes,
      })));
      console.log('[NextSessions] todayStr:', todayStr, 'now:', now.toISOString());

      const nonCompleted = allMapped.filter(
        s => getTrainingLiveStatus(s.date, s.time, s.duration_minutes) !== 'completed'
      );

      console.log('[NextSessions] After completed filter:', nonCompleted.length,
        'Dropped completed:', allMapped.filter(
          s => getTrainingLiveStatus(s.date, s.time, s.duration_minutes) === 'completed'
        ).map(s => ({ id: s.id, date: s.date, time: s.time, dur: s.duration_minutes }))
      );

      const inProgress = nonCompleted.filter(
        s => getTrainingLiveStatus(s.date, s.time, s.duration_minutes) === 'in_progress'
      );

      console.log('[NextSessions] In progress:', inProgress.map(s => ({ id: s.id, date: s.date, time: s.time })));

      const next7 = new Date(now);
      next7.setDate(next7.getDate() + 7);
      const next7Str = `${next7.getFullYear()}-${String(next7.getMonth() + 1).padStart(2, '0')}-${String(next7.getDate()).padStart(2, '0')}`;

      const todaySessions = nonCompleted.filter(s => s.date === todayStr);
      const upcomingSessions = nonCompleted.filter(
        s => s.date > todayStr && s.date <= next7Str
      );

      console.log('[NextSessions] todaySessions:', todaySessions.map(s => ({ id: s.id, date: s.date, time: s.time })));
      console.log('[NextSessions] upcomingSessions:', upcomingSessions.map(s => ({ id: s.id, date: s.date, time: s.time })));

      // Show all non-completed sessions: today first (with in-progress prioritized), then upcoming days.
      let toShow: Session[] = [];
      
      if (todaySessions.length > 0) {
        const allNext = nonCompleted.filter(s => s.date >= todayStr);
        const inProgressIds = new Set(inProgress.map(s => s.id));
        const rest = allNext.filter(s => !inProgressIds.has(s.id));
        toShow = [...inProgress, ...rest].slice(0, 10);
      } else {
        toShow = upcomingSessions.slice(0, 5);
      }

      console.log('[NextSessions] Final toShow:', toShow.map(s => ({ id: s.id, date: s.date, time: s.time, section: s.section_name })));
      setSessions(toShow);
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
      const session = sessions.find(s => s.id === sessionId);
      if (session?.max_participants) {
        const check = await scheduleApi.getParticipants(sessionId, token);
        if (check.data.max_participants && check.data.total >= check.data.max_participants) {
          if (tg) tg.showAlert(t('schedule.full'));
          await fetchSessions(false);
          setActionInProgress(null);
          return;
        }
      }

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
      } catch (error: unknown) {
        console.error('Failed to cancel booking:', error);
        const errMsg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || t('schedule.cancelError');
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
    duration_minutes: session.duration_minutes,
    location: session.club_address,
    max_participants: session.max_participants || null,
    current_participants: session.participants_count,
    participants: [],
    participants_preview: session.participants_preview,
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
          const liveStatus: LiveTrainingStatus = getTrainingLiveStatus(
            session.date, session.time, session.duration_minutes,
          );
          const isActive = liveStatus === 'in_progress';
          const isCompleted = liveStatus === 'completed';

          const todayStr = toLocalDateString();
          const isToday = session.date === todayStr;

          const getDateLabel = () => {
            if (isToday) return t('home.sessions.today');
            const [y, m, d] = session.date.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            if (date.getTime() === tomorrow.getTime()) return t('schedule.tomorrow');
            return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
          };

          return (
            <div
              key={session.id}
              className="snap-center shrink-0"
              style={{ width: sessions.length === 1 ? '100%' : '85%' }}
            >
              <div className={`rounded-[24px] p-5 shadow-sm relative overflow-hidden h-full flex flex-col ${
                isActive
                  ? 'bg-white border-l-[3px] border-l-[#10B981] border border-[#D1FAE5]'
                  : 'bg-white border border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#ECFDF5] text-[#059669] uppercase tracking-wider">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                      </span>
                      {t('schedule.inProgress')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#EFF6FF] text-[#2563EB] uppercase tracking-wider">
                      {getDateLabel()}
                    </span>
                  )}
                  
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
                  <p>{getDateLabel()}, {timeLabel}</p>
                  <p>Тренер: {session.coach_name || 'Не указан'}</p>
                  {session.club_address && (
                    <p className="text-[12px] text-[#9CA3AF] mt-0.5 truncate">{session.club_address}</p>
                  )}
                  {session.notes && (
                    <p className="text-[12px] text-[#6B7280] bg-gray-50 rounded-xl px-3 py-2 mt-1.5 whitespace-pre-wrap">
                      {session.notes}
                    </p>
                  )}
                  {!isCompleted && spotsLeft !== null && spotsLeft <= 5 && !session.is_booked && (
                    <p className={`${spotsLeft === 0 ? 'text-[#EF4444]' : 'text-[#F59E0B]'} font-bold mt-1`}>
                      {spotsLeft === 0 ? t('home.sessions.status.full') : `Осталось ${spotsLeft} места`}
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-2">
                  {isActive ? (
                    session.is_booked ? (
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowParticipantsFor(session); }}>
                          <AvatarGroup participants={session.participants_preview || []} totalCount={session.participants_count} />
                        </div>
                      </div>
                    ) : canBook ? (
                      <div className="flex flex-col gap-3">
                        {session.participants_count > 0 && (
                          <div className="flex items-center justify-end">
                            <div className="flex items-center cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowParticipantsFor(session); }}>
                              <AvatarGroup participants={session.participants_preview || []} totalCount={session.participants_count} />
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleBookSession(session.id)}
                          disabled={actionInProgress === session.id}
                          className="w-full py-3.5 bg-[#1E3A8A] text-white rounded-[16px] font-semibold text-[15px] hover:bg-blue-900 active:scale-[0.98] transition-all shadow-sm shadow-blue-900/20 disabled:opacity-60"
                        >
                          {actionInProgress === session.id
                            ? <Loader2 size={18} className="animate-spin mx-auto" />
                            : t('home.sessions.book')}
                        </button>
                      </div>
                    ) : null
                  ) : session.is_booked ? (
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => handleCancelBooking(session.id)}
                        disabled={actionInProgress === session.id}
                        className="p-2.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 active:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {actionInProgress === session.id
                          ? <Loader2 size={18} className="animate-spin" />
                          : <Ban size={18} />}
                      </button>
                      <div className="flex items-center cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowParticipantsFor(session); }}>
                        <AvatarGroup participants={session.participants_preview || []} totalCount={session.participants_count} />
                      </div>
                    </div>
                  ) : canBook ? (
                    <div className="flex flex-col gap-3">
                      {session.participants_count > 0 && (
                        <div className="flex items-center justify-end">
                          <div className="flex items-center cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowParticipantsFor(session); }}>
                            <AvatarGroup participants={session.participants_preview || []} totalCount={session.participants_count} />
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleBookSession(session.id)}
                        disabled={actionInProgress === session.id}
                        className="w-full py-3.5 bg-[#1E3A8A] text-white rounded-[16px] font-semibold text-[15px] hover:bg-blue-900 active:scale-[0.98] transition-all shadow-sm shadow-blue-900/20 disabled:opacity-60"
                      >
                        {actionInProgress === session.id
                          ? <Loader2 size={18} className="animate-spin mx-auto" />
                          : t('home.sessions.book')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {session.participants_count > 0 && (
                        <div className="flex items-center justify-end">
                          <div className="flex items-center cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowParticipantsFor(session); }}>
                            <AvatarGroup participants={session.participants_preview || []} totalCount={session.participants_count} />
                          </div>
                        </div>
                      )}
                      <div className="w-full py-3.5 bg-gray-50 text-gray-400 rounded-[16px] font-semibold text-[15px] text-center">
                        {t('schedule.full')}
                      </div>
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
