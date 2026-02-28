import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { MapPin, Users, Layers, ChevronRight, CheckCircle } from 'lucide-react';
import type { Club } from '../ClubsPage';

interface ClubCardProps {
  club: Club;
  isMember: boolean;
  onClick: () => void;
}

export const ClubCard: React.FC<ClubCardProps> = ({ club, isMember, onClick }) => {
  const { t } = useI18n();

  // Generate a unique gradient based on club name for fallback cover
  const getGradientStyle = () => {
    const gradients = [
      'from-slate-700 via-slate-600 to-slate-500',
      'from-zinc-700 via-neutral-600 to-stone-500',
      'from-gray-800 via-gray-700 to-gray-600',
      'from-slate-800 via-slate-700 to-slate-600',
      'from-neutral-800 via-neutral-700 to-neutral-600',
    ];
    const index = club.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-[24px] border border-gray-100 overflow-hidden cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-[0.98] transition-all duration-300 group"
    >
      {/* Cover Image Section with Logo */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-32 overflow-hidden bg-gray-100">
          {club.cover_url ? (
            <img 
              src={club.cover_url} 
              alt={club.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className={`w-full h-full bg-linear-to-br ${getGradientStyle()}`}>
              {/* Decorative pattern overlay */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-2 right-4 w-16 h-16 border border-white/20 rounded-full" />
                <div className="absolute bottom-4 right-12 w-8 h-8 border border-white/10 rounded-full" />
                <div className="absolute top-6 left-8 w-4 h-4 bg-white/10 rounded-full" />
              </div>
            </div>
          )}
          
          {/* Unifying premium overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500" />
        </div>
        
        {/* Member badge */}
        {isMember && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-[#ECFDF5]/95 backdrop-blur-md rounded-full shadow-sm ring-1 ring-[#059669]/20 z-10">
            <CheckCircle size={14} className="text-[#059669]" />
            <span className="text-xs font-medium text-[#065F46]">{t('clubs.card.member')}</span>
          </div>
        )}
        
        {/* Logo - positioned to overlap cover and content */}
        <div className="absolute -bottom-7 left-4 z-10">
          <div className="w-14 h-14 rounded-full ring-4 ring-white shadow-xl overflow-hidden bg-white">
            {club.logo_url ? (
              <img 
                src={club.logo_url} 
                alt={club.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-linear-to-br ${getGradientStyle()} flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">
                  {club.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="pt-9 pb-5 px-5">
        {/* Club Name & Address */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-[17px] leading-tight mb-1.5 group-hover:text-[#1E3A8A] transition-colors truncate">
              {club.name}
            </h3>
            {club.address && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <MapPin size={14} className="shrink-0 text-gray-400" />
                <span className="text-[13px] truncate">{club.address}</span>
              </div>
            )}
          </div>
          <div className="shrink-0 pt-1 text-gray-400 group-hover:text-[#2563EB] group-hover:translate-x-1 transition-all duration-300">
            <ChevronRight size={20} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-3.5">
          <div className="flex items-center gap-1.5">
            <Layers size={15} className="text-gray-400" />
            <span className="text-[13px] font-medium text-gray-600">{club.sections_count} {t('clubs.card.sections')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={15} className="text-gray-400" />
            <span className="text-[13px] font-medium text-gray-600">{club.students_count} {t('schedule.participants')}</span>
          </div>
        </div>

        {/* Tags */}
        {club.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {club.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 bg-gray-50/80 text-gray-500 border border-gray-100/80 text-[11px] font-medium rounded-lg"
              >
                {tag}
              </span>
            ))}
            {club.tags.length > 3 && (
              <span className="px-2.5 py-1 text-gray-400 bg-gray-50/80 border border-gray-100/80 rounded-lg text-[11px] font-medium">
                +{club.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
