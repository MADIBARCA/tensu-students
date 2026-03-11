import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { Bell, Eye, Loader2 } from 'lucide-react';
import { getTrainingLiveStatus, type LiveTrainingStatus } from '@/lib/utils/trainingStatus';
import { AvatarGroup } from '@/components/ui/AvatarGroup';
import type { Training } from '../SchedulePage';

interface TrainingCardProps {
  training: Training;
  onBook: () => void;
  onCancelBooking: () => void;
  onWaitlist: () => void;
  onShowParticipants: () => void;
  isActionInProgress?: boolean;
}

export const TrainingCard: React.FC<TrainingCardProps> = ({
  training,
  onBook,
  onCancelBooking,
  onWaitlist,
  onShowParticipants,
  isActionInProgress = false,
}) => {
  const { t, locale } = useI18n();

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
    return `${trainingDate.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}, ${timeStr}`;
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
      'from-[#34D399] to-[#14B8A6]',
      'from-violet-400 to-purple-500',
      'from-amber-400 to-orange-500',
      'from-rose-400 to-pink-500',
      'from-cyan-400 to-sky-500',
      'from-indigo-400 to-[#2563EB]',
    ];
    const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
    return palette[i];
  };

  const liveStatus: LiveTrainingStatus = getTrainingLiveStatus(
    training.date, training.time, training.duration_minutes,
  );
  const isCompleted = liveStatus === 'completed';
  const isActive = liveStatus === 'in_progress';

  const isFull = training.max_participants !== null && training.current_participants >= training.max_participants;
  const fillPct = training.max_participants
    ? Math.min((training.current_participants / training.max_participants) * 100, 100)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 6);
  const next7DaysStr = `${next7Days.getFullYear()}-${String(next7Days.getMonth() + 1).padStart(2, '0')}-${String(next7Days.getDate()).padStart(2, '0')}`;
  
  const isWithinBookingWindow = training.date >= todayStr && training.date <= next7DaysStr;
  const isPast = training.date < todayStr;

  // ── Render ───────────────────────────────────────────────

  const spotsLeft = training.max_participants ? training.max_participants - training.current_participants : null;

  return (
    <div className={`bg-white rounded-[14px] px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${
      isActive ? 'border-l-[3px] border-l-[#10B981] border border-[#D1FAE5]' :
      isCompleted ? 'opacity-75 border border-gray-200' :
      'active:scale-[0.98]'
    }`}>

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

        {/* Status badges */}
        {isActive && (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
            </span>
            {t('schedule.inProgress')}
          </span>
        )}
        {isCompleted && (
          <span className="shrink-0 text-[12px] font-medium text-[#6B7280] bg-gray-100 px-2.5 py-1 rounded-full">
            {t('schedule.completed')}
          </span>
        )}
        {!isActive && !isCompleted && training.is_booked && (
          <span className="shrink-0 text-[12px] font-medium text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full">
            ✓ {t('schedule.booked')}
          </span>
        )}
        {!isActive && !isCompleted && training.is_in_waitlist && !training.is_booked && (
          <span className="shrink-0 text-[12px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            {t('schedule.inWaitlist')}
          </span>
        )}
        {!isActive && !isCompleted && isFull && !training.is_booked && !training.is_in_waitlist && (
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
        <span className={!isCompleted && isFull ? 'text-red-500' : ''}>
          👥 {training.current_participants}/{training.max_participants ?? '∞'}
        </span>
      </div>

      {/* ── Row 4 · Location ──────────────────────────── */}
      {training.location && (
        <p className="text-[12px] text-[#9CA3AF] mb-2 truncate">{training.location}</p>
      )}

      {/* ── Fill bar (subtle) ─────────────────────────── */}
      {!isCompleted && training.max_participants !== null && (
        <div className="mb-3 mt-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[12px] font-medium ${isFull ? 'text-red-500' : fillPct > 75 ? 'text-amber-600' : 'text-gray-500'}`}>
              {isFull ? t('schedule.full') : spotsLeft && spotsLeft <= 5 ? `Осталось ${spotsLeft} места` : `${fillPct.toFixed(0)}% заполнено`}
            </span>
          </div>
          <div className="h-[4px] bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isFull ? 'bg-red-400' : fillPct > 75 ? 'bg-amber-400' : 'bg-[#10B981]'
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Notes ─────────────────────────────────────── */}
      {training.notes && (
        <p className="text-[12px] text-[#6B7280] bg-gray-50 rounded-xl px-3 py-2 mb-3">
          {training.notes}
        </p>
      )}

      {/* ── Actions ───────────────────────────────────── */}
      {isCompleted ? null : isActive ? (
        <div className="flex flex-col gap-3 pt-1">
          {training.is_booked ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 cursor-pointer" onClick={onShowParticipants}>
                {training.participants_preview && training.participants_preview.length > 0 && (
                  <AvatarGroup participants={training.participants_preview} totalCount={training.current_participants} />
                )}
              </div>
              <button
                onClick={onShowParticipants}
                className="flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-[#111] transition-colors"
              >
                <Eye size={14} />
                <span>{t('schedule.participants.title')}</span>
              </button>
            </div>
          ) : !isFull ? (
            training.is_membership_expired ? (
              <button
                disabled={true}
                className="w-full py-3.5 bg-gray-100 text-gray-400 rounded-[16px] font-semibold text-[15px] cursor-not-allowed"
              >
                {t('membership.status.expired')}
              </button>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                {training.current_participants > 0 && (
                  <div className="flex items-center justify-between w-full">
                    <div className="cursor-pointer" onClick={onShowParticipants}>
                      <AvatarGroup participants={training.participants_preview || []} totalCount={training.current_participants} />
                    </div>
                    <button
                      onClick={onShowParticipants}
                      className="flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-[#111] transition-colors"
                    >
                      <Eye size={14} />
                      <span>{t('schedule.participants.title')}</span>
                    </button>
                  </div>
                )}
                <button
                  onClick={onBook}
                  disabled={isActionInProgress}
                  className="w-full py-3.5 bg-[#1E3A8A] text-white rounded-[16px] font-semibold text-[15px] hover:bg-blue-900 active:scale-[0.98] transition-all shadow-sm shadow-blue-900/20 disabled:opacity-60"
                >
                  {isActionInProgress
                    ? <Loader2 size={18} className="animate-spin mx-auto" />
                    : t('schedule.book')}
                </button>
              </div>
            )
          ) : null}
        </div>
      ) : (training.is_booked || training.is_in_waitlist) ? (
        <div className="flex flex-col gap-3 pt-1">
          {training.is_booked ? (
            <div className="flex items-center justify-between w-full">
              {!isPast && (
                <button
                  onClick={onCancelBooking}
                  disabled={isActionInProgress}
                  className="text-[13px] font-medium text-red-500 hover:text-[#DC2626] active:text-[#7F1D1D] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isActionInProgress
                    ? <Loader2 size={14} className="animate-spin inline" />
                    : t('schedule.cancelBooking')}
                </button>
              )}
              <div className="flex-1 flex justify-center cursor-pointer mx-2" onClick={onShowParticipants}>
                {training.participants_preview && training.participants_preview.length > 0 && (
                  <AvatarGroup participants={training.participants_preview} totalCount={training.current_participants} />
                )}
              </div>
              <button
                onClick={onShowParticipants}
                className="flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-[#111] transition-colors whitespace-nowrap"
              >
                <Eye size={14} />
                <span>{t('schedule.participants.title')}</span>
              </button>
            </div>
          ) : (
             <button
              onClick={onWaitlist}
              disabled={true}
              className="text-[13px] font-medium transition-colors text-gray-300 cursor-not-allowed"
             >
               <span className="inline-flex items-center gap-1">
                 <Bell size={14} />
                 {t('schedule.inWaitlist')}
               </span>
             </button>
          )}
        </div>
      ) : isWithinBookingWindow ? (
        <div className="flex flex-col gap-3 pt-1">
          {training.current_participants > 0 && (
            <div className="flex items-center justify-between w-full mb-1">
              <div className="cursor-pointer" onClick={onShowParticipants}>
                <AvatarGroup participants={training.participants_preview || []} totalCount={training.current_participants} />
              </div>
              <button
                onClick={onShowParticipants}
                className="flex items-center gap-1 text-[13px] text-[#6B7280] hover:text-[#111] transition-colors"
              >
                <Eye size={14} />
                <span>{t('schedule.participants.title')}</span>
              </button>
            </div>
          )}
          {training.is_membership_expired ? (
             <button
               disabled={true}
               className="w-full py-3.5 bg-gray-100 text-gray-400 rounded-[16px] font-semibold text-[15px] cursor-not-allowed"
             >
               {t('membership.status.expired')}
             </button>
          ) : isFull ? (
            <button
              onClick={onWaitlist}
              disabled={isActionInProgress}
              className="text-[13px] font-medium transition-colors text-amber-600 hover:text-amber-700 active:text-amber-800 disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1">
                {isActionInProgress
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Bell size={14} />}
                {t('schedule.notifyMe')}
              </span>
            </button>
          ) : (
            <button
              onClick={onBook}
              disabled={isActionInProgress}
              className="w-full py-3.5 bg-[#1E3A8A] text-white rounded-[16px] font-semibold text-[15px] hover:bg-blue-900 active:scale-[0.98] transition-all shadow-sm shadow-blue-900/20 disabled:opacity-60"
            >
              {isActionInProgress
                ? <Loader2 size={18} className="animate-spin mx-auto" />
                : t('schedule.book')}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
};
