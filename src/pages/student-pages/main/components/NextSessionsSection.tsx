import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { 
  Calendar, 
  MapPin, 
  Users, 
  User, 
  FileText, 
  Clock, 
  CheckCircle, 
  Building2,
  ChevronRight,
  Bell
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

    return { dateLabel, timeLabel };
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
      'from-blue-400 to-blue-600',
      'from-emerald-400 to-emerald-600',
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
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('home.sessions.title')}</h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('home.sessions.title')}</h2>
        <Card className="text-center py-10">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">{t('home.sessions.empty')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('home.sessions.emptyHint')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{t('home.sessions.title')}</h2>
        <button 
          onClick={() => navigate('/student/schedule')}
          className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
        >
          {t('home.sessions.viewAll')}
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const { dateLabel, timeLabel } = formatDateTime(session.date, session.time);
          const isFull = session.status === 'full' || 
            (session.max_participants && session.participants_count >= session.max_participants);
          const canBook = !session.is_booked && !isFull;
          const spotsLeft = session.max_participants 
            ? session.max_participants - session.participants_count 
            : null;
          const participantProgress = session.max_participants 
            ? Math.min((session.participants_count / session.max_participants) * 100, 100)
            : 0;

          // Determine card styling based on status
          const getCardStyles = () => {
            if (session.is_booked) {
              return 'border-l-4 border-l-emerald-500 bg-emerald-50/30';
            }
            if (isFull) {
              return 'border-l-4 border-l-gray-300 bg-gray-50/50';
            }
            return 'border border-gray-100 hover:shadow-md';
          };

          return (
            <div 
              key={session.id} 
              className={`bg-white rounded-xl p-4 transition-all duration-200 ${getCardStyles()}`}
            >
              {/* Header: Club + Status */}
              <div className="flex items-center justify-between mb-3">
                {session.club_name && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg">
                    <Building2 size={12} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">{session.club_name}</span>
                  </div>
                )}
                {session.is_booked && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">
                    <CheckCircle size={12} />
                    {t('home.sessions.status.booked')}
                  </span>
                )}
                {isFull && !session.is_booked && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                    <Users size={12} />
                    {t('home.sessions.status.full')}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 text-base mb-1">
                {session.section_name}
                {session.group_name && (
                  <span className="text-gray-400 font-normal"> · {session.group_name}</span>
                )}
              </h3>

              {/* Coach with avatar */}
              {session.coach_name && (
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-6 h-6 rounded-full bg-linear-to-br ${getCoachColor(session.coach_name)} flex items-center justify-center`}>
                    <span className="text-white text-[10px] font-medium">{getCoachInitials(session.coach_name)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <User size={12} className="text-gray-400" />
                    <span>{session.coach_name}</span>
                  </div>
                </div>
              )}

              {/* Info: Date/Time and Participants */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg">
                  <Clock size={13} className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">{dateLabel}, {timeLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg">
                  <Users size={13} className={isFull ? 'text-red-500' : 'text-emerald-500'} />
                  <span className={`text-sm font-medium ${isFull ? 'text-red-600' : 'text-gray-700'}`}>
                    {session.participants_count}/{session.max_participants ?? '∞'}
                  </span>
                </div>
              </div>

              {/* Location */}
              {session.club_address && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <MapPin size={13} className="text-gray-400 shrink-0" />
                  <span className="truncate">{session.club_address}</span>
                </div>
              )}

              {/* Progress bar for participants */}
              {session.max_participants && (
                <div className="mb-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull ? 'bg-red-400' : participantProgress > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${participantProgress}%` }}
                    />
                  </div>
                  {!isFull && spotsLeft !== null && spotsLeft <= 3 && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">
                      {spotsLeft} {t('schedule.spotsLeft')}
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg mb-3">
                  <FileText size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">{session.notes}</p>
                </div>
              )}

              {/* Book Button */}
              {canBook && (
                <button
                  onClick={() => handleBookSession(session.id)}
                  className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-semibold shadow-sm shadow-blue-500/25"
                >
                  {t('home.sessions.book')}
                </button>
              )}

              {/* Booked state info */}
              {session.is_booked && (
                <div className="flex items-center justify-center gap-2 py-2 text-emerald-600">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">{t('home.sessions.youAreBooked')}</span>
                </div>
              )}

              {/* Full state - waitlist button placeholder */}
              {isFull && !session.is_booked && (
                <button
                  className="w-full px-4 py-2.5 bg-amber-50 border border-amber-300 text-amber-700 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-amber-100 transition-colors"
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
