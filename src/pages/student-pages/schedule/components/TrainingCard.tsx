import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { Clock, MapPin, Users, FileText, Bell, X as XIcon, Eye, Building2, User, CheckCircle } from 'lucide-react';
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

  const formatTrainingDate = (dateStr: string, timeStr: string): string => {
    // Parse date string directly to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const trainingDate = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Compare dates properly
    const trainingTime = trainingDate.getTime();
    const todayTime = today.getTime();
    const tomorrowTime = tomorrow.getTime();
    
    if (trainingTime === todayTime) {
      return `${t('schedule.today')}, ${timeStr}`;
    } else if (trainingTime === tomorrowTime) {
      return `${t('schedule.tomorrow')}, ${timeStr}`;
    } else {
      const daysDiff = Math.floor((trainingTime - todayTime) / (1000 * 60 * 60 * 24));
      if (daysDiff > 0 && daysDiff <= 5) {
        const weekdays = [
          t('schedule.weekdays.sun'),
          t('schedule.weekdays.mon'),
          t('schedule.weekdays.tue'),
          t('schedule.weekdays.wed'),
          t('schedule.weekdays.thu'),
          t('schedule.weekdays.fri'),
          t('schedule.weekdays.sat'),
        ];
        return `${weekdays[trainingDate.getDay()]}, ${timeStr}`;
      } else {
        return `${trainingDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}, ${timeStr}`;
      }
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

  const isFull = training.max_participants !== null && training.current_participants >= training.max_participants;
  const spotsLeft = training.max_participants !== null ? training.max_participants - training.current_participants : null;
  const participantProgress = training.max_participants 
    ? Math.min((training.current_participants / training.max_participants) * 100, 100)
    : 0;

  // Determine card border/accent based on status
  const getStatusStyles = () => {
    if (training.is_booked) {
      return 'border-l-4 border-l-emerald-500 bg-emerald-50/30';
    }
    if (training.is_in_waitlist) {
      return 'border-l-4 border-l-amber-500 bg-amber-50/30';
    }
    if (isFull) {
      return 'border-l-4 border-l-gray-300 bg-gray-50/50';
    }
    return 'border border-gray-100 hover:border-blue-200 hover:shadow-md';
  };

  return (
    <div className={`bg-white rounded-xl p-4 transition-all duration-200 ${getStatusStyles()}`}>
      {/* Header: Club badge + Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg">
            <Building2 size={12} className="text-blue-600" />
            <span className="text-xs font-medium text-blue-700">{training.club_name}</span>
          </div>
        </div>
        {training.is_booked && (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">
            <CheckCircle size={12} />
            {t('schedule.booked')}
          </span>
        )}
        {training.is_in_waitlist && !training.is_booked && (
          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-semibold">
            <Bell size={12} />
            {t('schedule.inWaitlist')}
          </span>
        )}
        {isFull && !training.is_booked && !training.is_in_waitlist && (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
            {t('schedule.full')}
          </span>
        )}
      </div>

      {/* Title: Section + Group */}
      <h3 className="font-semibold text-gray-900 text-base mb-1">
        {training.section_name}
        {training.group_name && (
          <span className="text-gray-400 font-normal"> · {training.group_name}</span>
        )}
      </h3>

      {/* Coach with avatar */}
      {training.trainer_name && (
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-7 h-7 rounded-full bg-linear-to-br ${getCoachColor(training.trainer_name)} flex items-center justify-center`}>
            <span className="text-white text-xs font-medium">{getCoachInitials(training.trainer_name)}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <User size={13} className="text-gray-400" />
            <span>{training.trainer_name}</span>
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Date & Time */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
          <Clock size={14} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-700">
            {formatTrainingDate(training.date, training.time)}
          </span>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
          <Users size={14} className={isFull ? 'text-red-500' : 'text-emerald-500'} />
          <span className={`text-sm font-medium ${isFull ? 'text-red-600' : 'text-gray-700'}`}>
            {training.current_participants}/{training.max_participants ?? '∞'}
          </span>
        </div>
      </div>

      {/* Location */}
      {training.location && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPin size={14} className="text-gray-400 shrink-0" />
          <span className="truncate">{training.location}</span>
        </div>
      )}

      {/* Participants progress bar */}
      {training.max_participants && (
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
      {training.notes && (
        <div className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg mb-3">
          <FileText size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">{training.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {training.is_booked ? (
          <>
            <button
              onClick={onCancelBooking}
              className="flex-1 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <XIcon size={16} />
              {t('schedule.cancelBooking')}
            </button>
            <button
              onClick={onShowParticipants}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Eye size={16} />
            </button>
          </>
        ) : isFull ? (
          <button
            onClick={onWaitlist}
            disabled={training.is_in_waitlist}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              training.is_in_waitlist
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Bell size={16} />
            {training.is_in_waitlist ? t('schedule.inWaitlist') : t('schedule.notifyMe')}
          </button>
        ) : (
          <button
            onClick={onBook}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-semibold shadow-sm shadow-blue-500/25"
          >
            {t('schedule.book')}
          </button>
        )}
      </div>
    </div>
  );
};
