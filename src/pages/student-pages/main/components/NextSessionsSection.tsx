import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { Calendar, MapPin, Users, User, FileText, Clock, X, CheckCircle } from 'lucide-react';
import { scheduleApi } from '@/functions/axios/axiosFunctions';
import type { SessionResponse, SessionStatus } from '@/functions/axios/responses';

interface Session {
  id: number;
  section_name: string;
  group_name?: string | null;
  coach_name: string | null;
  date: string;
  time: string;
  club_address: string | null;
  participants_count: number;
  max_participants?: number | null;
  notes?: string | null;
  status: SessionStatus;
}

export const NextSessionsSection: React.FC = () => {
  const { t } = useI18n();
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
          date: s.date,
          time: s.time,
          club_address: s.club_address,
          participants_count: s.participants_count,
          max_participants: s.max_participants,
          notes: s.notes,
          status: s.is_booked ? 'booked' : s.status,
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
    const sessionDate = new Date(`${date}T${time}`);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateLabel = '';
    if (sessionDate.toDateString() === today.toDateString()) {
      dateLabel = t('home.sessions.today');
    } else if (sessionDate.toDateString() === tomorrow.toDateString()) {
      dateLabel = t('home.sessions.tomorrow');
    } else {
      dateLabel = sessionDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
      });
    }

    const timeLabel = sessionDate.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return { dateLabel, timeLabel };
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      scheduled: {
        label: t('home.sessions.status.scheduled'),
        color: 'bg-blue-100 text-blue-800',
        icon: <Clock size={14} />,
      },
      cancelled: {
        label: t('home.sessions.status.cancelled'),
        color: 'bg-red-100 text-red-800',
        icon: <X size={14} />,
      },
      booked: {
        label: t('home.sessions.status.booked'),
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle size={14} />,
      },
      full: {
        label: t('home.sessions.status.full'),
        color: 'bg-gray-100 text-gray-800',
        icon: <Users size={14} />,
      },
    };
    return configs[status] || configs.scheduled;
  };

  const handleBookSession = async (sessionId: number) => {
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      
      // For now, just update local state
      // In production, this would call a booking API
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, status: 'booked' as SessionStatus } : s
      ));
      
      // Show success notification
      const tgApp = window.Telegram?.WebApp;
      if (tgApp) {
        tgApp.showAlert('Вы успешно записались на тренировку!');
      }
    } catch (error) {
      console.error('Failed to book session:', error);
      const tgApp = window.Telegram?.WebApp;
      if (tgApp) {
        tgApp.showAlert('Ошибка при записи на тренировку. Попробуйте еще раз.');
      }
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <SectionHeader title={t('home.sessions.title')} />
        <div className="text-center py-4 text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mb-6">
        <SectionHeader title={t('home.sessions.title')} />
        <Card className="text-center py-8">
          <p className="text-gray-600">{t('home.sessions.empty')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <SectionHeader title={t('home.sessions.title')} />
      <div className="space-y-3">
        {sessions.map((session) => {
          const { dateLabel, timeLabel } = formatDateTime(session.date, session.time);
          const statusConfig = getStatusConfig(session.status);
          const isFull = session.status === 'full' || 
            (session.max_participants && session.participants_count >= session.max_participants);
          const canBook = session.status === 'scheduled' && !isFull;

          return (
            <Card key={session.id}>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {session.section_name}
                    {session.group_name && ` • ${session.group_name}`}
                  </h3>
                  {session.coach_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={14} />
                      <span>{session.coach_name}</span>
                    </div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar size={14} />
                <span>{dateLabel}</span>
                <span className="mx-1">•</span>
                <Clock size={14} />
                <span>{timeLabel}</span>
              </div>

              {/* Address */}
              {session.club_address && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin size={14} />
                  <span className="flex-1">{session.club_address}</span>
                </div>
              )}

              {/* Participants */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Users size={14} />
                <span>
                  {session.participants_count}
                  {session.max_participants && ` / ${session.max_participants}`}
                </span>
              </div>

              {/* Notes */}
              {session.notes && (
                <div className="flex items-start gap-2 text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                  <FileText size={14} className="mt-0.5" />
                  <span className="flex-1">{session.notes}</span>
                </div>
              )}

              {/* Book Button */}
              {canBook && (
                <button
                  onClick={() => handleBookSession(session.id)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  {t('home.sessions.book')}
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
