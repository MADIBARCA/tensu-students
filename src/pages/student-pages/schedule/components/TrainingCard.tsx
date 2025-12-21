import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { Card } from '@/components/ui';
import { Clock, MapPin, Users, MessageSquare, Bell, X as XIcon, Eye, Snowflake, Check } from 'lucide-react';
import type { Training } from '../SchedulePage';

interface TrainingCardProps {
  training: Training;
  onBook: () => void;
  onCancelBooking: () => void;
  onWaitlist: () => void;
  onShowParticipants: () => void;
  onFreeze: () => void;
  onUnfreeze: () => void;
}

export const TrainingCard: React.FC<TrainingCardProps> = ({
  training,
  onBook,
  onCancelBooking,
  onWaitlist,
  onShowParticipants,
  onFreeze,
  onUnfreeze,
}) => {
  const { t } = useI18n();

  const formatTrainingDate = (dateStr: string, timeStr: string): string => {
    const trainingDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const daysDiff = Math.floor((trainingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      return `${t('schedule.today')}, ${timeStr}`;
    } else if (daysDiff === 1) {
      return `${t('schedule.tomorrow')}, ${timeStr}`;
    } else if (daysDiff <= 5) {
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
  };

  const isFull = training.max_participants !== null && training.current_participants >= training.max_participants;
  const spotsLeft = training.max_participants !== null ? training.max_participants - training.current_participants : null;

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {training.section_name}
            {training.group_name && (
              <span className="text-gray-500 font-normal"> • {training.group_name}</span>
            )}
          </h3>
          <p className="text-sm text-gray-600">{training.trainer_name}</p>
        </div>
        {training.is_excused && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium flex items-center gap-1">
            <Snowflake size={12} />
            {t('schedule.excused')}
          </span>
        )}
        {training.is_booked && !training.is_excused && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
            {t('schedule.booked')}
          </span>
        )}
        {training.is_in_waitlist && !training.is_booked && !training.is_excused && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
            {t('schedule.inWaitlist')}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} className="text-gray-400" />
          <span>{formatTrainingDate(training.date, training.time)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} className="text-gray-400" />
          <span>{training.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-gray-400" />
          <span className={isFull ? 'text-red-600' : 'text-gray-600'}>
            {training.current_participants}/{training.max_participants ?? '∞'} {t('schedule.participants')}
            {!isFull && spotsLeft !== null && spotsLeft <= 3 && (
              <span className="text-orange-500 ml-1">
                ({spotsLeft} {t('schedule.spotsLeft')})
              </span>
            )}
          </span>
        </div>
        {training.notes && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MessageSquare size={16} className="text-gray-400 mt-0.5" />
            <span>{training.notes}</span>
          </div>
        )}
      </div>

      {/* Club name */}
      <p className="text-xs text-gray-500 mb-3">{training.club_name}</p>

      {/* Actions */}
      <div className="space-y-2">
        {training.is_excused ? (
          /* Excused state - only show unfreeze button */
          <button
            onClick={onUnfreeze}
            className="w-full px-3 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Check size={16} />
            {t('schedule.unfreeze')}
          </button>
        ) : training.is_booked ? (
          /* Booked state - freeze, cancel, participants */
          <div className="flex gap-2">
            <button
              onClick={onFreeze}
              className="flex-1 px-3 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium flex items-center justify-center gap-1"
            >
              <Snowflake size={16} />
              {t('schedule.freezeBooking')}
            </button>
            <button
              onClick={onCancelBooking}
              className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center gap-1"
            >
              <XIcon size={16} />
            </button>
            <button
              onClick={onShowParticipants}
              className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center gap-1"
            >
              <Eye size={16} />
            </button>
          </div>
        ) : isFull ? (
          /* Full - only waitlist */
          <button
            onClick={onWaitlist}
            disabled={training.is_in_waitlist}
            className={`w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
              training.is_in_waitlist
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'border border-yellow-400 text-yellow-600 hover:bg-yellow-50'
            }`}
          >
            <Bell size={16} />
            {training.is_in_waitlist ? t('schedule.inWaitlist') : t('schedule.notifyMe')}
          </button>
        ) : (
          /* Not booked, not excused, not full - show book and freeze options */
          <>
            <button
              onClick={onBook}
              className="w-full px-3 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              {t('schedule.book')}
            </button>
            <button
              onClick={onFreeze}
              className="w-full px-3 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <Snowflake size={14} />
              {t('schedule.cantAttend')}
            </button>
          </>
        )}
      </div>
    </Card>
  );
};
