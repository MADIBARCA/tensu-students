import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/i18n';
import { X, Users, Loader2 } from 'lucide-react';
import { scheduleApi } from '@/functions/axios/axiosFunctions';
import type { ParticipantResponse } from '@/functions/axios/responses';
import type { Training } from '../SchedulePage';

interface ParticipantsModalProps {
  training: Training;
  onClose: () => void;
}

const avatarColor = (id: number): string => {
  const c = [
    'bg-[#2563EB]', 'bg-[#10B981]', 'bg-violet-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
  ];
  return c[id % c.length];
};

const initials = (first: string, last?: string | null): string =>
  first.charAt(0).toUpperCase() + (last ? last.charAt(0).toUpperCase() : '');

const clubInitials = (name: string | null): string => {
  if (!name) return '?';
  const p = name.split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
};

const clubGradient = (name: string | null): string => {
  if (!name) return 'from-gray-400 to-gray-500';
  const c = [
    'from-blue-400 to-indigo-500', 'from-[#34D399] to-[#14B8A6]',
    'from-violet-400 to-purple-500', 'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500', 'from-cyan-400 to-sky-500',
  ];
  return c[name.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % c.length];
};

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({ training, onClose }) => {
  const { t } = useI18n();
  const [participants, setParticipants] = useState<ParticipantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(training.max_participants);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        const res = await scheduleApi.getParticipants(training.id, token);
        setParticipants(res.data.participants);
        setMaxParticipants(res.data.max_participants);
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [training.id, t]);

  const isFull = !loading && participants.length > 0 && maxParticipants !== null && participants.length >= maxParticipants;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">

        {/* ── Header ──────────────────────────────── */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[17px] font-semibold text-[#111]">
              {t('schedule.participants.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 -mr-1.5 text-[#9CA3AF] hover:text-[#111] rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Club + Section */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] overflow-hidden shrink-0">
              {training.club_logo_url ? (
                <img src={training.club_logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-linear-to-br ${clubGradient(training.club_name)} flex items-center justify-center`}>
                  <span className="text-white text-[11px] font-semibold">{clubInitials(training.club_name)}</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-[#111] truncate">{training.club_name}</p>
              <p className="text-[12px] text-[#6B7280] truncate">{training.section_name} · {training.time}</p>
            </div>
          </div>

          {/* Count */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[13px] text-[#6B7280]">
              <Users size={14} className="inline -mt-0.5 mr-1" />
              {loading ? '…' : participants.length}{maxParticipants !== null && ` / ${maxParticipants}`}
            </span>
            {isFull && (
              <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {t('home.sessions.status.full')}
              </span>
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={28} className="text-[#9CA3AF] animate-spin mb-2" />
              <p className="text-[13px] text-[#9CA3AF]">{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-[14px]">{error}</p>
            </div>
          ) : participants.length > 0 ? (
            <div className="space-y-1">
              {participants.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    p.is_current_user ? 'bg-[#ECFDF5]/60' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      p.photo_url ? '' : avatarColor(p.id)
                    }`}>
                      {p.photo_url ? (
                        <img src={p.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-[13px] font-semibold">{initials(p.first_name, p.last_name)}</span>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-[16px] h-[16px] bg-white rounded-full border border-gray-100 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-[#9CA3AF]">{i + 1}</span>
                    </div>
                  </div>

                  {/* Name */}
                  <p className={`flex-1 text-[14px] truncate ${
                    p.is_current_user ? 'font-medium text-[#065F46]' : 'text-[#111]'
                  }`}>
                    {p.first_name}{p.last_name && ` ${p.last_name}`}
                  </p>

                  {p.is_current_user && (
                    <span className="text-[11px] font-medium text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                      {t('schedule.participants.you')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <Users size={24} className="text-[#D1D5DB]" />
              </div>
              <p className="text-[14px] text-[#9CA3AF]">{t('schedule.participants.empty')}</p>
              <p className="text-[12px] text-[#D1D5DB] mt-1">{t('schedule.participants.beFirst')}</p>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
          <button
            onClick={onClose}
            className="btn-primary w-full py-3 text-[13px]"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
