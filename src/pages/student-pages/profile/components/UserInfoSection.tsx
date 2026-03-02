import React from 'react';
import { Edit2 } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { useI18n } from '@/i18n/i18n';
import type { StudentResponse } from '@/functions/axios/responses';
import { formatPhone, makeCall } from '@/utils/formatPhone';

interface UserInfoSectionProps {
  student: StudentResponse | null;
  onEdit: () => void;
}

export const UserInfoSection: React.FC<UserInfoSectionProps> = ({ student, onEdit }) => {
  const { user } = useTelegram();
  const { t } = useI18n();

  const displayName = student
    ? `${student.first_name} ${student.last_name || ''}`.trim()
    : user
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : 'Пользователь';

  const displayPhone = student?.phone_number || user?.phone_number || 'Не указан';
  const photoUrl = student?.photo_url || (user?.photo_url && typeof user.photo_url === 'string' ? user.photo_url : '') || '';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5 relative overflow-hidden">
      {/* Subtle decorative background gradient */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-gradient-to-br from-blue-50 to-transparent rounded-full opacity-60 pointer-events-none" />

      <div className="flex items-center gap-5 relative z-10">
        {/* Photo */}
        <div className="relative">
          <label htmlFor="photo-upload" className="cursor-pointer block group">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm border border-gray-100 transition-transform group-hover:scale-[1.02]">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#2563EB] to-[#1E3A8A] flex items-center justify-center text-white text-3xl font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[11px] font-semibold mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {t('profile.activeMember')}
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            <button
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-full transition-colors"
            >
              <Edit2 size={16} />
            </button>
          </div>
          <p onClick={() => makeCall(displayPhone)} className="text-sm font-medium text-gray-500 hover:text-[#1E3A8A] transition-colors cursor-pointer inline-block">
            {formatPhone(displayPhone)}
          </p>
        </div>
      </div>
    </div>
  );
};
