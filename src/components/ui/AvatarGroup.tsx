import React from 'react';
import type { ParticipantResponse } from '@/functions/axios/responses';

interface AvatarGroupProps {
  participants: ParticipantResponse[];
  totalCount: number;
  maxDisplay?: number;
  className?: string;
  avatarClassName?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  participants,
  totalCount,
  maxDisplay = 2,
  className = '',
  avatarClassName = '',
}) => {
  if (!participants || participants.length === 0 || totalCount === 0) {
    return null;
  }

  const displayParticipants = participants.slice(0, maxDisplay);
  const remainingCount = Math.max(0, totalCount - displayParticipants.length);

  const getInitials = (firstName: string, lastName: string | null) => {
    let initials = firstName.charAt(0);
    if (lastName) {
      initials += lastName.charAt(0);
    }
    return initials.toUpperCase();
  };

  const getAvatarGradient = (id: number) => {
    const palette = [
      'from-blue-400 to-indigo-500',
      'from-[#34D399] to-[#14B8A6]',
      'from-violet-400 to-purple-500',
      'from-amber-400 to-orange-500',
      'from-rose-400 to-pink-500',
      'from-cyan-400 to-sky-500',
      'from-indigo-400 to-[#2563EB]',
    ];
    return palette[id % palette.length];
  };

  return (
    <div className={`flex items-center ${className}`}>
      {displayParticipants.map((p, index) => (
        <div
          key={p.id}
          className={`relative rounded-full border-2 border-white overflow-hidden shrink-0 ${
            index !== 0 ? '-ml-2.5' : ''
          } ${avatarClassName || 'w-7 h-7'}`}
          style={{ zIndex: displayParticipants.length - index }}
        >
          {p.photo_url ? (
            <img
              src={p.photo_url}
              alt={p.first_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-linear-to-br ${getAvatarGradient(p.id)} flex items-center justify-center`}>
              <span className="text-white text-[10px] font-semibold leading-none">
                {getInitials(p.first_name, p.last_name)}
              </span>
            </div>
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={`relative rounded-full border-2 border-white bg-gray-100 flex items-center justify-center shrink-0 -ml-2.5 ${
            avatarClassName || 'w-7 h-7'
          }`}
          style={{ zIndex: 0 }}
        >
          <span className="text-[10px] font-semibold text-gray-500">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
};
