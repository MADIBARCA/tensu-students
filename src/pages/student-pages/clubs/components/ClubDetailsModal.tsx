import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/i18n/i18n';
import { Card } from '@/components/ui';
import { 
  X, 
  MapPin, 
  Clock, 
  Phone, 
  MessageCircle, 
  Layers, 
  CreditCard, 
  Users, 
  Award,
  CheckCircle2,
  ChevronRight,
  Building2,
  BadgeCheck,
  Calendar,
  Snowflake,
  RefreshCw,
  ArrowUpCircle,
  Lock,
  Sparkles
} from 'lucide-react';
import { PurchaseMembershipModal } from './PurchaseMembershipModal';
import { FreezeMembershipModal } from '../../profile/components/FreezeMembershipModal';
import { clubsApi, membershipsApi } from '@/functions/axios/axiosFunctions';
import type { ClubDetailResponse, ClubSectionResponse, ClubTariffResponse, ClubCoachResponse, MembershipResponse } from '@/functions/axios/responses';
import type { Club } from '../ClubsPage';

interface Section {
  id: number;
  name: string;
  description?: string | null;
}

interface MembershipPlan {
  id: number;
  name: string;
  type: string;
  price: number;
  duration_days: number | null;
  description?: string | null;
  features: string[];
  sessions_count?: number | null;
}

interface Coach {
  id: number;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  specialization: string | null;
}

interface ClubDetailsModalProps {
  club: Club;
  isMember?: boolean;
  onClose: () => void;
}

// Active membership info for a tariff
interface ActiveMembershipInfo {
  membershipId: number;
  tariffId: number;
  endDate: string;
  status: string;
  tariffName: string | null;
  tariffType: string;
  price: number;
  freezeDaysAvailable: number;
  freezeDaysUsed: number;
  freezeStartDate: string | null;
  freezeEndDate: string | null;
  features: string[];
}

export const ClubDetailsModal: React.FC<ClubDetailsModalProps> = ({ club, onClose }) => {
  const { t } = useI18n();
  const [sections, setSections] = useState<Section[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'memberships'>('info');
  // Current active membership in this club (if any)
  const [activeMembershipForClub, setActiveMembershipForClub] = useState<ActiveMembershipInfo | null>(null);

  useEffect(() => {
    const loadClubDetails = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        // Fetch club details and active memberships in parallel
        const [clubResponse, membershipsResponse] = await Promise.all([
          clubsApi.getById(club.id, token),
          membershipsApi.getActive(token).catch(() => ({ data: { memberships: [] } })),
        ]);
        
        const details: ClubDetailResponse = clubResponse.data;
        const activeMemberships: MembershipResponse[] = membershipsResponse.data.memberships || [];
        
        // Map tariffs to membership plans first to get features
        const mappedPlans: MembershipPlan[] = details.tariffs.map((t: ClubTariffResponse) => ({
          id: t.id,
          name: t.name,
          type: t.payment_type,
          price: t.price,
          duration_days: t.duration_days,
          description: t.description,
          features: t.features || [],
          sessions_count: t.sessions_count,
        }));
        
        // Build map of active tariffs for this club
        const tariffMap = new Map<number, ActiveMembershipInfo>();
        let primaryActiveMembership: ActiveMembershipInfo | null = null;
        
        activeMemberships.forEach((m: MembershipResponse) => {
          // Only consider memberships for this club that are active or frozen
          if (m.club_id === club.id && m.tariff_id && (m.status === 'active' || m.status === 'frozen' || m.status === 'new')) {
            // Find the plan to get features and type
            const plan = mappedPlans.find(p => p.id === m.tariff_id);
            
            const membershipInfo: ActiveMembershipInfo = {
              membershipId: m.id,
              tariffId: m.tariff_id,
              endDate: m.end_date,
              status: m.status,
              tariffName: m.tariff_name,
              tariffType: plan?.type || 'monthly',
              price: m.price,
              freezeDaysAvailable: m.freeze_days_available,
              freezeDaysUsed: m.freeze_days_used,
              freezeStartDate: m.freeze_start_date,
              freezeEndDate: m.freeze_end_date,
              features: plan?.features || [],
            };
            
            tariffMap.set(m.tariff_id, membershipInfo);
            
            // Set primary active membership (prioritize active over frozen)
            if (!primaryActiveMembership || (m.status === 'active' && primaryActiveMembership.status === 'frozen')) {
              primaryActiveMembership = membershipInfo;
            }
          }
        });
        setActiveMembershipForClub(primaryActiveMembership);
        
        // Map sections
        const mappedSections: Section[] = details.sections.map((s: ClubSectionResponse) => ({
          id: s.id,
          name: s.name,
          description: s.description,
        }));

        // Map coaches from real API data
        const mappedCoaches: Coach[] = (details.coaches || []).map((c: ClubCoachResponse) => ({
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          photo_url: c.photo_url,
          specialization: c.specialization,
        }));

        setSections(mappedSections);
        setMembershipPlans(mappedPlans);
        setCoaches(mappedCoaches);
      } catch (error) {
        console.error('Failed to load club details:', error);
        setSections([]);
        setMembershipPlans([]);
        setCoaches([]);
      } finally {
        setLoading(false);
      }
    };

    loadClubDetails();
  }, [club.id]);

  const handleContactClick = (type: 'telegram' | 'whatsapp' | 'phone') => {
    const tg = window.Telegram?.WebApp;
    if (type === 'telegram' && club.telegram_url) {
      tg?.openLink?.(club.telegram_url);
    } else if (type === 'whatsapp' && club.whatsapp_url) {
      tg?.openLink?.(club.whatsapp_url);
    } else if (type === 'phone' && club.phone) {
      window.location.href = `tel:${club.phone}`;
    }
  };

  const handlePurchase = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPlanDuration = (plan: MembershipPlan) => {
    if (plan.duration_days) {
      if (plan.duration_days === 30) return t('clubs.details.duration.month');
      if (plan.duration_days === 90) return t('clubs.details.duration.quarter');
      if (plan.duration_days === 180) return t('clubs.details.duration.halfYear');
      if (plan.duration_days === 365) return t('clubs.details.duration.year');
      return t('clubs.details.duration.days', { days: plan.duration_days });
    }
    if (plan.type === 'monthly') return t('clubs.details.duration.month');
    if (plan.type === 'quarterly') return t('clubs.details.duration.quarter');
    if (plan.type === 'semi_annual') return t('clubs.details.duration.halfYear');
    if (plan.type === 'annual') return t('clubs.details.duration.year');
    return plan.type;
  };

  // Check if plan has real features
  const hasFeatures = (plan: MembershipPlan): boolean => {
    return plan.features && plan.features.length > 0;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  // Generate initials for avatar fallback
  const getCoachInitials = (coach: Coach) => {
    const first = coach.first_name?.[0] || '';
    const last = coach.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  // Get full name for coach
  const getCoachFullName = (coach: Coach) => {
    return [coach.first_name, coach.last_name].filter(Boolean).join(' ');
  };

  // Generate a consistent color based on name
  const getAvatarColor = (coach: Coach) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-emerald-400 to-emerald-600',
      'bg-gradient-to-br from-violet-400 to-violet-600',
      'bg-gradient-to-br from-amber-400 to-amber-600',
      'bg-gradient-to-br from-rose-400 to-rose-600',
      'bg-gradient-to-br from-cyan-400 to-cyan-600',
    ];
    const name = getCoachFullName(coach);
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Categorize plans relative to active membership
  const categorizedPlans = useMemo(() => {
    if (!activeMembershipForClub) {
      // No active membership - all plans are available
      return {
        activePlan: null,
        upgrades: [],
        alternatives: membershipPlans,
        sameLevel: [],
      };
    }

    const activePrice = activeMembershipForClub.price;
    const activeType = activeMembershipForClub.tariffType;
    const activeTariffId = activeMembershipForClub.tariffId;
    
    const activePlan = membershipPlans.find(p => p.id === activeTariffId) || null;
    const upgrades: MembershipPlan[] = [];
    const alternatives: MembershipPlan[] = [];
    const sameLevel: MembershipPlan[] = [];

    membershipPlans.forEach(plan => {
      // Skip the active plan itself
      if (plan.id === activeTariffId) return;
      
      // Determine plan category
      const priceDiff = plan.price - activePrice;
      const isDifferentType = plan.type !== activeType;
      
      if (priceDiff > 0) {
        // More expensive = upgrade
        upgrades.push(plan);
      } else if (isDifferentType) {
        // Different type (e.g., monthly vs session_pack) = alternative format
        alternatives.push(plan);
      } else if (Math.abs(priceDiff) < activePrice * 0.1) {
        // Similar price, same type = same level (don't show)
        sameLevel.push(plan);
      } else {
        // Lower price, could be downgrade or different offering
        alternatives.push(plan);
      }
    });

    // Sort upgrades by price ascending
    upgrades.sort((a, b) => a.price - b.price);
    
    return {
      activePlan,
      upgrades,
      alternatives,
      sameLevel,
    };
  }, [membershipPlans, activeMembershipForClub]);

  // Calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle freeze action
  const handleFreeze = () => {
    setShowFreezeModal(true);
  };

  // Reload data after freeze/unfreeze
  const handleFreezeSuccess = async () => {
    setShowFreezeModal(false);
    setLoading(true);
    // Re-trigger the effect by changing something
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      const membershipsResponse = await membershipsApi.getActive(token);
      const activeMemberships: MembershipResponse[] = membershipsResponse.data.memberships || [];
      
      const tariffMap = new Map<number, ActiveMembershipInfo>();
      let primaryActiveMembership: ActiveMembershipInfo | null = null;
      
      activeMemberships.forEach((m: MembershipResponse) => {
        if (m.club_id === club.id && m.tariff_id && (m.status === 'active' || m.status === 'frozen' || m.status === 'new')) {
          const plan = membershipPlans.find(p => p.id === m.tariff_id);
          
          const membershipInfo: ActiveMembershipInfo = {
            membershipId: m.id,
            tariffId: m.tariff_id,
            endDate: m.end_date,
            status: m.status,
            tariffName: m.tariff_name,
            tariffType: plan?.type || 'monthly',
            price: m.price,
            freezeDaysAvailable: m.freeze_days_available,
            freezeDaysUsed: m.freeze_days_used,
            freezeStartDate: m.freeze_start_date,
            freezeEndDate: m.freeze_end_date,
            features: plan?.features || [],
          };
          
          tariffMap.set(m.tariff_id, membershipInfo);
          
          if (!primaryActiveMembership || (m.status === 'active' && primaryActiveMembership.status === 'frozen')) {
            primaryActiveMembership = membershipInfo;
          }
        }
      });
      setActiveMembershipForClub(primaryActiveMembership);
    } catch (error) {
      console.error('Failed to reload memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div 
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header with gradient */}
        <div className="relative">
          {/* Cover gradient background */}
          <div className="h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700" />
          
          {/* Club logo/icon */}
          <div className="absolute -bottom-8 left-4">
            {club.logo_url ? (
              <img 
                src={club.logo_url} 
                alt={club.name}
                className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Building2 size={28} className="text-blue-600" />
              </div>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Club name and stats */}
        <div className="px-4 pt-10 pb-3">
          <h2 className="text-xl font-bold text-gray-900">{club.name}</h2>
          {club.address && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={14} />
              {club.address}
            </p>
          )}
          
          {/* Stats pills */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full">
              <Layers size={14} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-700">{sections.length || club.sections_count} {t('clubs.card.sections')}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full">
              <Users size={14} className="text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">{t('clubs.details.studentsCount', { count: club.students_count })}</span>
            </div>
            {coaches.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 rounded-full">
                <Award size={14} className="text-violet-600" />
                <span className="text-xs font-medium text-violet-700">{t('clubs.details.trainersCount', { count: coaches.length })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 border-b border-gray-100">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'info' 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('clubs.details.info')}
              {activeTab === 'info' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('memberships')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'memberships' 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('clubs.details.memberships')}
              {activeTab === 'memberships' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === 'info' ? (
            <div className="p-4 space-y-5">
              {/* Description */}
              {club.description && (
                <div>
                  <p className="text-sm text-gray-600 leading-relaxed">{club.description}</p>
                </div>
              )}

              {/* Working hours and phone */}
              <div className="space-y-3">
                {club.working_hours && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Clock size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('clubs.details.hours')}</p>
                      <p className="text-sm font-medium text-gray-900">{club.working_hours}</p>
                    </div>
                  </div>
                )}

                {club.phone && (
                  <button 
                    onClick={() => handleContactClick('phone')}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Phone size={18} className="text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{t('clubs.details.phone')}</p>
                      <p className="text-sm font-medium text-blue-600">{club.phone}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                )}
              </div>

              {/* Contact Buttons */}
              {(club.telegram_url || club.whatsapp_url) && (
                <div className="flex gap-2">
                  {club.telegram_url && (
                    <button
                      onClick={() => handleContactClick('telegram')}
                      className="flex-1 px-4 py-3 bg-[#229ED9]/10 text-[#229ED9] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#229ED9]/20 transition-colors"
                    >
                      <MessageCircle size={18} />
                      Telegram
                    </button>
                  )}
                  {club.whatsapp_url && (
                    <button
                      onClick={() => handleContactClick('whatsapp')}
                      className="flex-1 px-4 py-3 bg-[#25D366]/10 text-[#25D366] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-colors"
                    >
                      <MessageCircle size={18} />
                      WhatsApp
                    </button>
                  )}
                </div>
              )}

              {/* Coaches Section */}
              {coaches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Award size={16} className="text-violet-500" />
                      {t('clubs.details.trainers')}
                    </h3>
                    {coaches.length > 4 && (
                      <button className="text-xs text-blue-600 font-medium">
                        {t('clubs.details.viewAll')}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {coaches.map((coach) => (
                      <div 
                        key={coach.id}
                        className="flex-shrink-0 w-20 text-center"
                      >
                        <div className={`w-16 h-16 mx-auto rounded-2xl ${getAvatarColor(coach)} flex items-center justify-center shadow-md overflow-hidden`}>
                          {coach.photo_url ? (
                            <img 
                              src={coach.photo_url} 
                              alt={getCoachFullName(coach)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-lg">
                              {getCoachInitials(coach)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-900 mt-2 truncate">
                          {coach.first_name}
                        </p>
                        {coach.specialization && (
                          <p className="text-[10px] text-gray-400 truncate">{coach.specialization}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sections */}
              {sections.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Layers size={16} className="text-blue-500" />
                    {t('clubs.details.sections')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {sections.map((section) => (
                      <div 
                        key={section.id} 
                        className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100"
                      >
                        <p className="font-medium text-gray-900 text-sm">{section.name}</p>
                        {section.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{section.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-5">
              {/* Active Membership Section */}
              {activeMembershipForClub && categorizedPlans.activePlan && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BadgeCheck size={18} className="text-emerald-600" />
                    <h3 className="font-semibold text-gray-900">{t('clubs.membership.yourActive')}</h3>
                  </div>
                  
                  <Card className="p-4 border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white relative overflow-hidden">
                    {/* Status badge */}
                    <div className="absolute top-0 right-0">
                      <div className={`text-white text-[10px] font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1 ${
                        activeMembershipForClub.status === 'frozen' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}>
                        {activeMembershipForClub.status === 'frozen' ? (
                          <>
                            <Snowflake size={12} />
                            {t('clubs.membership.frozen')}
                          </>
                        ) : (
                          <>
                            <BadgeCheck size={12} />
                            {t('clubs.membership.active')}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Plan header */}
                    <div className="flex items-start justify-between mb-3 pr-20">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{categorizedPlans.activePlan.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{getPlanDuration(categorizedPlans.activePlan)}</p>
                      </div>
                    </div>
                    
                    {/* Expiration info */}
                    <div className="bg-white/60 rounded-xl p-3 mb-4 border border-emerald-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-emerald-600" />
                          <span className="text-sm text-gray-600">{t('clubs.membership.expiresOn')}</span>
                        </div>
                        <span className="font-semibold text-gray-900">{formatDate(activeMembershipForClub.endDate)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">{t('clubs.membership.daysRemaining')}</span>
                        <span className={`text-sm font-semibold ${getDaysRemaining(activeMembershipForClub.endDate) <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {getDaysRemaining(activeMembershipForClub.endDate)} {t('clubs.membership.days')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Features */}
                    {activeMembershipForClub.features.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">{t('clubs.membership.includedBenefits')}</p>
                        <div className="space-y-1.5">
                          {activeMembershipForClub.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                          {activeMembershipForClub.features.length > 3 && (
                            <p className="text-xs text-gray-400 ml-6">+{activeMembershipForClub.features.length - 3} {t('clubs.membership.more')}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {activeMembershipForClub.status !== 'frozen' ? (
                        <button
                          onClick={handleFreeze}
                          disabled={activeMembershipForClub.freezeDaysAvailable <= 0}
                          className="px-3 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Snowflake size={16} />
                          {t('clubs.membership.freeze')}
                        </button>
                      ) : (
                        <button
                          onClick={handleFreeze}
                          className="px-3 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                        >
                          <Snowflake size={16} />
                          {t('clubs.membership.unfreeze')}
                        </button>
                      )}
                      <button
                        onClick={() => categorizedPlans.activePlan && handlePurchase(categorizedPlans.activePlan)}
                        className="px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                      >
                        <RefreshCw size={16} />
                        {t('clubs.membership.extend')}
                      </button>
                    </div>
                    
                    {/* Freeze days info */}
                    {activeMembershipForClub.status !== 'frozen' && activeMembershipForClub.freezeDaysAvailable > 0 && (
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        {t('clubs.membership.freezeDaysLeft', { days: activeMembershipForClub.freezeDaysAvailable })}
                      </p>
                    )}
                  </Card>
                </div>
              )}

              {/* Upgrade Options */}
              {activeMembershipForClub && categorizedPlans.upgrades.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle size={18} className="text-violet-600" />
                    <h3 className="font-semibold text-gray-900">{t('clubs.membership.upgradeOptions')}</h3>
                  </div>
                  
                  {categorizedPlans.upgrades.map((plan) => (
                    <Card key={plan.id} className="p-4 border border-violet-200 bg-violet-50/30 relative overflow-hidden">
                      <div className="absolute top-0 right-0">
                        <div className="bg-violet-500 text-white text-[10px] font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                          <Sparkles size={12} />
                          {t('clubs.membership.upgrade')}
                        </div>
                      </div>
                      
                      <div className="flex items-start justify-between mb-3 pr-16">
                        <div>
                          <h4 className="font-bold text-gray-900">{plan.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{getPlanDuration(plan)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-violet-600">{formatPrice(plan.price)}</p>
                        </div>
                      </div>
                      
                      {hasFeatures(plan) && (
                        <div className="mb-3">
                          <div className="space-y-1.5">
                            {plan.features.slice(0, 2).map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-violet-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handlePurchase(plan)}
                        className="w-full px-4 py-2.5 bg-violet-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-violet-700 transition-colors"
                      >
                        <ArrowUpCircle size={16} />
                        {t('clubs.membership.upgradeNow')}
                      </button>
                    </Card>
                  ))}
                </div>
              )}

              {/* Alternative Options (different format) */}
              {activeMembershipForClub && categorizedPlans.alternatives.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-gray-600" />
                    <h3 className="font-semibold text-gray-900">{t('clubs.membership.otherOptions')}</h3>
                  </div>
                  
                  {categorizedPlans.alternatives.map((plan) => (
                    <Card key={plan.id} className="p-4 border border-gray-200 relative">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{getPlanDuration(plan)}</p>
                        </div>
                        <p className="text-lg font-bold text-gray-700">{formatPrice(plan.price)}</p>
                      </div>
                      
                      {hasFeatures(plan) && (
                        <div className="mb-3">
                          <div className="space-y-1">
                            {plan.features.slice(0, 2).map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-600">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handlePurchase(plan)}
                        className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                      >
                        <CreditCard size={16} />
                        {t('clubs.details.purchase')}
                      </button>
                    </Card>
                  ))}
                </div>
              )}

              {/* Same level plans - shown as disabled */}
              {activeMembershipForClub && categorizedPlans.sameLevel.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-gray-400" />
                    <h3 className="font-medium text-gray-500 text-sm">{t('clubs.membership.sameLevelPlans')}</h3>
                  </div>
                  
                  {categorizedPlans.sameLevel.map((plan) => (
                    <Card key={plan.id} className="p-3 border border-gray-100 bg-gray-50 opacity-60">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-600">{plan.name}</h4>
                          <p className="text-xs text-gray-400">{getPlanDuration(plan)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">{formatPrice(plan.price)}</span>
                          <Lock size={14} className="text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Calendar size={12} />
                        {t('clubs.membership.availableAfterExpiry')}
                      </p>
                    </Card>
                  ))}
                </div>
              )}

              {/* No active membership - show all plans */}
              {!activeMembershipForClub && membershipPlans.length > 0 && (
                <>
                  {membershipPlans.map((plan, index) => {
                    const isPopular = index === 1 || (membershipPlans.length === 1 && index === 0);
                    
                    return (
                      <Card 
                        key={plan.id} 
                        className={`p-4 relative overflow-hidden transition-all ${
                          isPopular 
                            ? 'border-2 border-blue-500 shadow-lg shadow-blue-100' 
                            : 'border border-gray-200'
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute top-0 right-0">
                            <div className="bg-blue-500 text-white text-[10px] font-semibold px-3 py-1 rounded-bl-lg">
                              {t('clubs.membership.popular')}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{plan.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{getPlanDuration(plan)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{formatPrice(plan.price)}</p>
                            {plan.duration_days && plan.duration_days >= 30 && (
                              <p className="text-xs text-gray-400">
                                {formatPrice(Math.round(plan.price / (plan.duration_days / 30)))}{t('clubs.details.perMonth')}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {plan.description && (
                          <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                        )}

                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-500 mb-2">{t('clubs.membership.includes')}</p>
                          {hasFeatures(plan) ? (
                            <div className="space-y-2">
                              {plan.features.slice(0, 4).map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">{feature}</span>
                                </div>
                              ))}
                              {plan.features.length > 4 && (
                                <p className="text-xs text-gray-400 ml-6">+{plan.features.length - 4} {t('clubs.membership.more')}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              {t('clubs.membership.noFeatures')}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handlePurchase(plan)}
                          className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                            isPopular
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          <CreditCard size={18} />
                          {t('clubs.details.purchase')}
                        </button>
                      </Card>
                    );
                  })}
                </>
              )}
              
              {/* Empty state */}
              {membershipPlans.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard size={28} className="text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium">{t('clubs.details.noTariffs')}</p>
                  <p className="text-sm text-gray-500 mt-1">{t('clubs.details.contactClub')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PurchaseMembershipModal
          club={club}
          plan={selectedPlan}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
            onClose();
          }}
        />
      )}

      {/* Freeze Modal */}
      {showFreezeModal && activeMembershipForClub && (
        <FreezeMembershipModal
          membership={{
            id: activeMembershipForClub.membershipId,
            status: activeMembershipForClub.status,
            freeze_days_available: activeMembershipForClub.freezeDaysAvailable,
            freeze_days_used: activeMembershipForClub.freezeDaysUsed,
            freeze_start_date: activeMembershipForClub.freezeStartDate,
            freeze_end_date: activeMembershipForClub.freezeEndDate,
          }}
          onClose={() => setShowFreezeModal(false)}
          onSuccess={handleFreezeSuccess}
        />
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
