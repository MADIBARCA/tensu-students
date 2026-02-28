import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { 
  MapPin, 
  Users, 
  User, 
  FileText, 
  Clock, 
  CheckCircle, 
  Building2,
  ChevronRight,
  Bell,
  Flame,
  Dumbbell,
  CalendarDays,
  Map
} from 'lucide-react';
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
          id: s.id,
          section_name: s.section_name,
          group_name: s.group_name,
          coach_name: s.coach_name,
          club_name: s.club_name,
          date: s.date,
          time: s.time,
          club_address: s.club_address,
          participants_count: s.participants_count,
          max_participants: s.max_participants,
          notes: s.notes,
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

    // Also figure out time of day for motivational text
    const hour = parseInt(time.slice(0, 2), 10);
    let timeOfDay = 'day';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 18) timeOfDay = 'evening';

    return { dateLabel, timeLabel, timeOfDay };
  };

  const getCountdown = (date: string, time: string) => {
    try {
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const sessionTime = new Date(year, month - 1, day, hours, minutes).getTime();
      const now = new Date().getTime();
      const diff = sessionTime - now;

      if (diff <= 0) return null;

      const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minsLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (daysLeft > 0) return t('home.sessions.countdown', { days: daysLeft, hours: hoursLeft });
      if (hoursLeft > 0) return t('home.sessions.countdown.hours', { hours: hoursLeft, minutes: minsLeft });
      return t('home.sessions.countdown.minutes', { minutes: minsLeft });
    } catch {
      return null;
    }
  };

  // Generate coach initials
  const getCoachInitials = (name: string | null): string => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate a consistent color for coach avatar based on name
  const getCoachColor = (name: string | null): string => {
    if (!name) return 'from-gray-400 to-gray-500';
    const colors = [
      'from-blue-400 to-[#1E3A8A]',
      'from-[#34D399] to-[#059669]',
      'from-violet-400 to-violet-600',
      'from-amber-400 to-amber-600',
      'from-rose-400 to-rose-600',
      'from-cyan-400 to-cyan-600',
      'from-indigo-400 to-indigo-600',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
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
      
        if (tg) {
          tg.showAlert(response.data.message || t('home.sessions.bookingSuccess'));
        }
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
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 tracking-tight">{t('home.sessions.title')}</h2>
        <div className="flex items-center justify-center py-10 bg-white rounded-[24px] border border-gray-100 shadow-sm">
          <div className="w-8 h-8 border-3 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 tracking-tight">{t('home.sessions.title')}</h2>
        <Card className="text-center py-10 rounded-[24px] relative overflow-hidden border-dashed border-2 border-gray-200 bg-gray-50/50">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 rotate-3">
            <Dumbbell size={28} className="text-[#2563EB]" />
          </div>
          <p className="text-[15px] text-gray-600 font-medium px-4 mb-5 leading-relaxed tracking-tight">
            {t('home.sessions.emptyNew')}
          </p>
          <button 
            onClick={() => navigate('/student/schedule')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white rounded-[16px] hover:opacity-90 active:scale-[0.98] transition-all font-semibold text-sm shadow-md shadow-blue-900/10"
          >
            {t('home.noMembership.findClub')} <ChevronRight size={16} />
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">{t('home.sessions.title')}</h2>
        <button 
          onClick={() => navigate('/student/schedule')}
          className="flex items-center gap-1 text-[13px] text-[#2563EB] font-bold hover:text-[#1E3A8A] transition-colors tracking-wide uppercase"
        >
          {t('home.sessions.viewAll')}
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {sessions.map((session, index) => {
          const { dateLabel, timeLabel, timeOfDay } = formatDateTime(session.date, session.time);
          const isFull = session.status === 'full' || 
            (session.max_participants && session.participants_count >= session.max_participants);
          const canBook = !session.is_booked && !isFull;
          const spotsLeft = session.max_participants 
            ? session.max_participants - session.participants_count 
            : null;
          const participantProgress = session.max_participants 
            ? Math.min((session.participants_count / session.max_participants) * 100, 100)
            : 0;

          const isHero = index === 0;
          const countdownText = isHero ? getCountdown(session.date, session.time) : null;

          // Determine card styling based on status
          const getCardStyles = () => {
            if (isHero) {
              return 'border-2 border-blue-500/10 bg-linear-to-b from-blue-50/80 to-white shadow-xl shadow-blue-900/5';
            }
            if (session.is_booked) {
              return 'border border-blue-100 bg-linear-to-b from-blue-50/30 to-white shadow-sm';
            }
            if (isFull) {
              return 'border border-gray-100 bg-gray-50/50';
            }
            return 'border border-gray-100 bg-white hover:shadow-md shadow-sm';
          };

          return (
            <div 
              key={session.id} 
              className={`rounded-[24px] p-5 transition-all duration-300 relative overflow-hidden ${getCardStyles()}`}
            >
              {isHero && (
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 mix-blend-multiply pointer-events-none"></div>
              )}

              {/* Hero Badge & Countdown */}
              {isHero && (
                <div className="mb-5 relative z-10 flex flex-col gap-2.5">
                  <div className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A] text-white rounded-xl shadow-sm">
                    <Flame size={14} className="text-amber-300" />
                    <span className="text-[11px] font-bold tracking-wider uppercase">{t('home.sessions.heroText')}</span>
                  </div>
                  {countdownText && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      <div className="text-[14px] font-black text-[#1E3A8A] flex items-center gap-1.5 tracking-tight">
                        <Clock size={16} className="text-[#2563EB]" />
                        {countdownText}
                      </div>
                      <p className="text-[13px] text-gray-500 font-medium ml-5">
                        {t(`home.sessions.motivational.${timeOfDay}`)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Header: Club + Status */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                {session.club_name && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                    <Building2 size={12} className="text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700">{session.club_name}</span>
                  </div>
                )}
                {session.is_booked && !isHero && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100/50 text-[#1E3A8A] border border-blue-200/50 text-xs rounded-full font-bold tracking-tight shadow-sm">
                    <CheckCircle size={12} />
                    {t('home.sessions.status.booked')}
                  </span>
                )}
                {isFull && !session.is_booked && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-xs rounded-full font-bold tracking-tight">
                    <Users size={12} />
                    {t('home.sessions.status.full')}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-extrabold text-[#111827] text-[17px] mb-1 leading-tight tracking-tight relative z-10">
                {session.section_name}
                {session.group_name && (
                  <span className="text-gray-400 font-semibold tracking-normal"> · {session.group_name}</span>
                )}
              </h3>

              {/* Coach with avatar */}
              {session.coach_name && (
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <div className={`w-6 h-6 rounded-full bg-linear-to-br ${getCoachColor(session.coach_name)} flex items-center justify-center shadow-inner`}>
                    <span className="text-white text-[10px] font-bold">{getCoachInitials(session.coach_name)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[13px] font-medium text-gray-600">
                    <User size={12} className="text-gray-400" />
                    <span>{session.coach_name}</span>
                  </div>
                </div>
              )}

              {/* Info: Date/Time and Participants */}
              <div className="flex flex-wrap items-center gap-2 mb-4 relative z-10">
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${isHero ? 'bg-white border-blue-50 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                  <Clock size={13} className="text-[#2563EB]" />
                  <span className="text-[13px] font-bold text-gray-700">{dateLabel}, {timeLabel}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${isHero ? 'bg-white border-blue-50 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                  <Users size={13} className={isFull ? 'text-[#EF4444]' : 'text-[#10B981]'} />
                  <span className={`text-[13px] font-bold ${isFull ? 'text-[#EF4444]' : 'text-gray-700'}`}>
                    {session.participants_count}/{session.max_participants ?? '∞'}
                  </span>
                </div>
              </div>

              {/* Location */}
              {session.club_address && (
                <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-4 font-medium relative z-10">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate">{session.club_address}</span>
                </div>
              )}

              {/* Progress bar for participants */}
              {session.max_participants && !session.is_booked && (
                <div className="mb-5 relative z-10 bg-gray-50/50 rounded-2xl p-3 border border-gray-100/50">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[12px] font-semibold text-gray-500">
                      {t('home.sessions.spotsTaken', { current: session.participants_count, max: session.max_participants })}
                    </span>
                    {!isFull && spotsLeft !== null && spotsLeft <= 5 && (
                      <span className={`text-[12px] font-bold tracking-tight animate-pulse flex items-center gap-1 ${spotsLeft <= 2 ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                        <Flame size={12} />
                        {spotsLeft} {t('schedule.spotsLeft')}
                      </span>
                    )}
                  </div>
                  <div className="h-2.5 bg-gray-200/80 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${
                        isFull 
                          ? 'bg-linear-to-r from-red-500 to-red-600' 
                          : participantProgress >= 90 
                            ? 'bg-linear-to-r from-orange-400 to-amber-500' 
                            : 'bg-linear-to-r from-emerald-400 to-teal-500'
                      }`}
                      style={{ width: `${participantProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl mb-4 relative z-10">
                  <FileText size={14} className="text-[#2563EB] mt-0.5 shrink-0" />
                  <p className="text-[13px] text-blue-900 font-medium leading-relaxed">{session.notes}</p>
                </div>
              )}

              {/* Book Button */}
              {canBook && (
                <button
                  onClick={() => handleBookSession(session.id)}
                  className={`w-full px-4 py-3.5 text-white rounded-[16px] transition-all text-[15px] font-bold flex items-center justify-center gap-2 relative z-10 ${
                    spotsLeft && spotsLeft <= 5 
                      ? 'bg-linear-to-r from-[#2563EB] to-[#1E3A8A] hover:opacity-90 shadow-lg shadow-blue-600/20 animate-pulse' 
                      : 'bg-[#1E3A8A] hover:bg-[#1e3a8a]/90 shadow-lg shadow-[#1E3A8A]/20 active:scale-[0.98]'
                  }`}
                >
                  {spotsLeft && spotsLeft <= 5 ? (
                    <>
                      <Flame size={16} className="text-amber-300" />
                      {spotsLeft} {t('schedule.spotsLeft')} – {t('home.sessions.book')}
                    </>
                  ) : (
                    t('home.sessions.book')
                  )}
                </button>
              )}

              {/* Booked state info & actions */}
              {session.is_booked && (
                <div className="mt-2 space-y-2 relative z-10">
                  <div className="flex items-center justify-center gap-2 py-3 text-white bg-linear-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                    <CheckCircle size={18} />
                    <span className="text-[15px] font-bold">{t('home.sessions.youAreBooked')}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-[#1E3A8A] rounded-xl hover:bg-blue-100 transition-colors font-medium border border-blue-100/50"
                      onClick={() => window.Telegram?.WebApp.showAlert(t('home.sessions.actions.calendar'))}
                    >
                      <CalendarDays size={18} />
                      <span className="text-[11px] leading-tight text-center px-1">{t('home.sessions.actions.calendar')}</span>
                    </button>
                    <button 
                      className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-[#1E3A8A] rounded-xl hover:bg-blue-100 transition-colors font-medium border border-blue-100/50"
                      onClick={() => window.Telegram?.WebApp.showAlert(t('home.sessions.actions.route'))}
                    >
                      <Map size={18} />
                      <span className="text-[11px] leading-tight text-center px-1">{t('home.sessions.actions.route')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full state - waitlist button placeholder */}
              {isFull && !session.is_booked && (
                <button
                  className="w-full px-4 py-3.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-[16px] text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-amber-100 active:scale-[0.98] transition-all relative z-10"
                >
                  <Bell size={16} />
                  {t('schedule.notifyMe')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

