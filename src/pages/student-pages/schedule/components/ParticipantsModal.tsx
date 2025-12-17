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

// Generate a consistent color based on user ID
const getAvatarColor = (id: number): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-rose-500',
    'bg-emerald-500',
  ];
  return colors[id % colors.length];
};

// Get initials from name
const getInitials = (firstName: string, lastName?: string | null): string => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
};

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({ training, onClose }) => {
  const { t } = useI18n();
  const [participants, setParticipants] = useState<ParticipantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(training.max_participants);

  useEffect(() => {
    const loadParticipants = async () => {
      setLoading(true);
      setError(null);
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        const response = await scheduleApi.getParticipants(training.id, token);
        setParticipants(response.data.participants);
        setMaxParticipants(response.data.max_participants);
      } catch (err) {
        console.error('Failed to load participants:', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    loadParticipants();
  }, [training.id, t]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('schedule.participants.title')}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {training.section_name} • {training.time}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Participants count badge */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
              <Users size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {loading ? '...' : participants.length}
                {maxParticipants && ` / ${maxParticipants}`}
              </span>
            </div>
            {!loading && participants.length > 0 && maxParticipants && participants.length >= maxParticipants && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                {t('home.sessions.status.full')}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="text-blue-500 animate-spin mb-3" />
              <p className="text-gray-500 text-sm">{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : participants.length > 0 ? (
            <div className="space-y-2">
              {/* Avatar stack preview */}
              {participants.length > 1 && (
                <div className="flex items-center justify-center mb-6">
                  <div className="flex -space-x-3">
                    {participants.slice(0, 5).map((participant, index) => (
                      <div
                        key={participant.id}
                        className={`relative w-12 h-12 rounded-full border-3 border-white shadow-sm flex items-center justify-center ${
                          participant.photo_url ? '' : getAvatarColor(participant.id)
                        }`}
                        style={{ zIndex: 5 - index }}
                      >
                        {participant.photo_url ? (
                          <img
                            src={participant.photo_url}
                            alt={participant.first_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold text-sm">
                            {getInitials(participant.first_name, participant.last_name)}
                          </span>
                        )}
                      </div>
                    ))}
                    {participants.length > 5 && (
                      <div className="relative w-12 h-12 rounded-full border-3 border-white bg-gray-200 flex items-center justify-center shadow-sm">
                        <span className="text-gray-600 font-semibold text-xs">
                          +{participants.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Participant list */}
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      participant.is_current_user 
                        ? 'bg-green-50 border border-green-100' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm ${
                          participant.photo_url ? '' : getAvatarColor(participant.id)
                        }`}
                      >
                        {participant.photo_url ? (
                          <img
                            src={participant.photo_url}
                            alt={participant.first_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {getInitials(participant.first_name, participant.last_name)}
                          </span>
                        )}
                      </div>
                      {/* Position badge */}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-gray-500">{index + 1}</span>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${
                        participant.is_current_user ? 'text-green-800' : 'text-gray-900'
                      }`}>
                        {participant.first_name}
                        {participant.last_name && ` ${participant.last_name}`}
                      </p>
                    </div>

                    {/* Current user badge */}
                    {participant.is_current_user && (
                      <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-full shadow-sm">
                        {t('schedule.participants.you')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-center">{t('schedule.participants.empty')}</p>
              <p className="text-gray-400 text-sm mt-1 text-center">
                {t('schedule.participants.beFirst')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/25"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
