import React from 'react';
import { useI18n } from '@/i18n/i18n';
import { MapPin, Users, Layers, ChevronRight, CheckCircle, Sparkles } from 'lucide-react';
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
      'from-indigo-500 via-purple-500 to-pink-400',
      'from-cyan-500 via-blue-500 to-indigo-500',
      'from-emerald-500 via-teal-500 to-cyan-500',
      'from-orange-400 via-rose-500 to-pink-500',
      'from-violet-500 via-purple-500 to-fuchsia-500',
      'from-blue-500 via-indigo-500 to-violet-500',
    ];
    const index = club.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 group"
    >
      {/* Cover Image Section */}
      <div className="relative h-28 overflow-hidden">
        {club.cover_url ? (
          <img 
            src={club.cover_url} 
            alt={club.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-linear-to-br ${getGradientStyle()}`}>
            {/* Decorative pattern overlay */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-2 right-4 w-16 h-16 border border-white/40 rounded-full" />
              <div className="absolute bottom-4 right-12 w-8 h-8 border border-white/30 rounded-full" />
              <div className="absolute top-6 left-8 w-4 h-4 bg-white/20 rounded-full" />
            </div>
          </div>
        )}
        
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Member badge */}
        {isMember && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full shadow-sm">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">{t('clubs.card.member')}</span>
          </div>
        )}
        
        {/* Logo - positioned to overlap cover and content */}
        <div className="absolute -bottom-8 left-4">
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
      <div className="pt-9 pb-4 px-4">
        {/* Club Name & Address */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors">
            {club.name}
          </h3>
          {club.address && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin size={13} className="shrink-0" />
              <span className="text-xs truncate">{club.address}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg">
            <Layers size={13} className="text-blue-500" />
            <span className="text-xs font-medium text-blue-700">{club.sections_count}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg">
            <Users size={13} className="text-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">{club.students_count}</span>
          </div>
        </div>

        {/* Tags */}
        {club.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {club.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-md"
              >
                {tag}
              </span>
            ))}
            {club.tags.length > 3 && (
              <span className="px-2 py-0.5 text-gray-400 text-[11px]">
                +{club.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 text-blue-600">
            <Sparkles size={14} />
            <span className="text-xs font-medium">{t('clubs.card.viewDetails')}</span>
          </div>
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <ChevronRight size={16} className="text-blue-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
