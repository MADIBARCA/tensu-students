import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { Bell, Eye } from 'lucide-react';
import type { Training } from '../SchedulePage';

interface TrainingCardProps {
  training: Training;
  onBook: () => void;
  onCancelBooking: () => void;
  onWaitlist: () => void;
  onShowParticipants: () => void;
}

export const TrainingCard: React.FC<TrainingCardProps> = ({
  training,
  onBook,
  onCancelBooking,
  onWaitlist,
  onShowParticipants,
}) => {
  const { t } = useI18n();

  // ── Helpers ──────────────────────────────────────────────

  const formatTrainingDate = (dateStr: string, timeStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const trainingDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const trainingTime = trainingDate.getTime();

    if (trainingTime === today.getTime()) {
      return `${t('schedule.today')}, ${timeStr}`;
    }
    if (trainingTime === tomorrow.getTime()) {
      return `${t('schedule.tomorrow')}, ${timeStr}`;
    }
    const daysDiff = Math.floor((trainingTime - today.getTime()) / 86_400_000);
    if (daysDiff > 0 && daysDiff <= 5) {
      const wd = [
        t('schedule.weekdays.sun'), t('schedule.weekdays.mon'),
        t('schedule.weekdays.tue'), t('schedule.weekdays.wed'),
        t('schedule.weekdays.thu'), t('schedule.weekdays.fri'),
        t('schedule.weekdays.sat'),
      ];
      return `${wd[trainingDate.getDay()]}, ${timeStr}`;
    }
    return `${trainingDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}, ${timeStr}`;
  };

  const initials = (name: string | null): string => {
    if (!name) return '?';
    const p = name.split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const avatarGradient = (name: string | null): string => {
    if (!name) return 'from-gray-400 to-gray-500';
    const palette = [
      'from-blue-400 to-indigo-500',
      'from-emerald-400 to-teal-500',
      'from-violet-400 to-purple-500',
      'from-amber-400 to-orange-500',
      'from-rose-400 to-pink-500',
      'from-cyan-400 to-sky-500',
      'from-indigo-400 to-blue-500',
    ];
    const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
    return palette[i];
  };

  const isFull = training.max_participants !== null && training.current_participants >= training.max_participants;
  const fillPct = training.max_participants
    ? Math.min((training.current_participants / training.max_participants) * 100, 100)
    : 0;

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="bg-white rounded-[14px] px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]">

      {/* ── Row 1 · Club + Status ─────────────────────── */}
      <div className="flex items-center gap-3 mb-3">
        {/* Club avatar */}
        <div className="w-9 h-9 rounded-[10px] overflow-hidden shrink-0">
          {training.club_logo_url ? (
            <img src={training.club_logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-linear-to-br ${avatarGradient(training.club_name)} flex items-center justify-center`}>
              <span className="text-white text-[11px] font-semibold leading-none">{initials(training.club_name)}</span>
            </div>
          )}
        </div>

        {/* Club name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[#111] leading-tight truncate">
            {training.club_name}
          </p>
          <p className="text-[13px] text-[#6B7280] leading-tight mt-0.5 truncate">
            {training.section_name}
            {training.group_name && <span> · {training.group_name}</span>}
          </p>
        </div>

        {/* Status */}
        {training.is_booked && (
          <span className="shrink-0 text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            ✓ {t('schedule.booked')}
          </span>
        )}
        {training.is_in_waitlist && !training.is_booked && (
          <span className="shrink-0 text-[12px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            {t('schedule.inWaitlist')}
          </span>
        )}
        {isFull && !training.is_booked && !training.is_in_waitlist && (
          <span className="shrink-0 text-[12px] font-medium text-[#6B7280] bg-gray-100 px-2.5 py-1 rounded-full">
            {t('schedule.full')}
          </span>
        )}
      </div>

      {/* ── Row 2 · Coach (if present) ────────────────── */}
      {training.trainer_name && (
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
            {training.trainer_photo_url ? (
              <img src={training.trainer_photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-linear-to-br ${avatarGradient(training.trainer_name)} flex items-center justify-center`}>
                <span className="text-white text-[9px] font-semibold leading-none">{initials(training.trainer_name)}</span>
              </div>
            )}
          </div>
          <span className="text-[13px] text-[#6B7280]">{training.trainer_name}</span>
        </div>
      )}

      {/* ── Row 3 · Time · Participants ────────────────── */}
      <div className="flex items-center gap-4 text-[13px] text-[#111] mb-1.5">
        <span>🕐 {formatTrainingDate(training.date, training.time)}</span>
        <span className={isFull ? 'text-red-500' : ''}>
          👥 {training.current_participants}/{training.max_participants ?? '∞'}
        </span>
      </div>

      {/* ── Row 4 · Location ──────────────────────────── */}
      {training.location && (
        <p className="text-[12px] text-[#9CA3AF] mb-2 truncate">{training.location}</p>
      )}

      {/* ── Fill bar (subtle) ─────────────────────────── */}
      {training.max_participants !== null && (
        <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden mb-3 mt-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull ? 'bg-red-300' : fillPct > 75 ? 'bg-amber-300' : 'bg-emerald-300'
            }`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      )}

      {/* ── Notes ─────────────────────────────────────── */}
      {training.notes && (
        <p className="text-[12px] text-[#6B7280] bg-gray-50 rounded-xl px-3 py-2 mb-3">
          {training.notes}
        </p>
      )}

      {/* ── Actions ───────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-1">
        {training.is_booked ? (
          <>
            <button
              onClick={onCancelBooking}
              className="text-[13px] font-medium text-red-500 hover:text-red-600 active:text-red-700 transition-colors"
            >
              {t('schedule.cancelBooking')}
            </button>
            <div className="flex-1" />
            <button
              onClick={onShowParticipants}
              className="flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-[#111] transition-colors"
            >
              <Eye size={14} />
              <span>{t('schedule.participants.title')}</span>
            </button>
          </>
        ) : isFull ? (
          <button
            onClick={onWaitlist}
            disabled={training.is_in_waitlist}
            className={`text-[13px] font-medium transition-colors ${
              training.is_in_waitlist
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-amber-600 hover:text-amber-700 active:text-amber-800'
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <Bell size={14} />
              {training.is_in_waitlist ? t('schedule.inWaitlist') : t('schedule.notifyMe')}
            </span>
          </button>
        ) : (
          <button
            onClick={onBook}
            className="w-full py-2.5 bg-[#111] text-white text-[13px] font-medium rounded-xl hover:bg-[#222] active:bg-[#333] transition-colors"
          >
            {t('schedule.book')}
          </button>
        )}
      </div>
    </div>
  );
};
