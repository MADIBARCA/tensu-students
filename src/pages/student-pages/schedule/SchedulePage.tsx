import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { Filter, X, CreditCard, ShoppingBag } from 'lucide-react';
import { TrainingCard } from './components/TrainingCard';
import { CalendarView } from './components/CalendarView';
import { FiltersModal } from './components/FiltersModal';
import { NoMembershipModal } from './components/NoMembershipModal';
import { ParticipantsModal } from './components/ParticipantsModal';
import { Card } from '@/components/ui';
import { scheduleApi, membershipsApi, clubsApi } from '@/functions/axios/axiosFunctions';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import type { SessionResponse, TrainerResponse, ClubResponse, MembershipResponse } from '@/functions/axios/responses';

const POLL_INTERVAL = 15_000;

export interface Training {
  id: number;
  section_name: string;
  group_name?: string | null;
  trainer_name: string | null;
  trainer_id: number | null;
  trainer_photo_url: string | null;
  club_id: number;
  club_name: string | null;
  club_logo_url: string | null;
  date: string;
  time: string;
  location: string | null;
  max_participants: number | null;
  current_participants: number;
  participants?: string[];
  notes?: string | null;
  is_booked: boolean;
  is_in_waitlist: boolean;
}

export interface Club {
  id: number;
  name: string;
}

export interface Trainer {
  id: number;
  name: string;
  club_id: number | null;
}

export interface Filters {
  clubId: number | null;
  sectionsType: 'all' | 'my';
  trainerId: number | null;
}

export default function SchedulePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveMembership, setHasActiveMembership] = useState(true);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    clubId: null,
    sectionsType: 'all',
    trainerId: null,
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Modals
  const [showNoMembershipModal, setShowNoMembershipModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);

  // Calendar
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Prevent double-click / concurrent actions
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      const [sessionsResponse, membershipsResponse] = await Promise.all([
        scheduleApi.getSessions(token, 1, 300, { only_my_sessions: filters.sectionsType === 'my' }),
        membershipsApi.getActive(token),
      ]);
      const activeMembershipClubIds = new Set<number>(
        membershipsResponse.data.memberships.map((m: MembershipResponse) => m.club_id)
      );
      const mappedTrainings: Training[] = sessionsResponse.data.sessions
        .filter((s: SessionResponse) => activeMembershipClubIds.has(s.club_id))
        .map((s: SessionResponse) => ({
          id: s.id,
          section_name: s.section_name,
          group_name: s.group_name,
          trainer_name: s.coach_name,
          trainer_id: s.coach_id,
          trainer_photo_url: s.coach_photo_url,
          club_id: s.club_id,
          club_name: s.club_name,
          club_logo_url: s.club_logo_url,
          date: s.date,
          time: s.time,
          location: s.location || s.club_address,
          max_participants: s.max_participants,
          current_participants: s.participants_count,
          participants: [],
          notes: s.notes,
          is_booked: s.is_booked,
          is_in_waitlist: s.is_in_waitlist,
        }));
      setTrainings(mappedTrainings);
    } catch (err) {
      console.error('Failed to refresh sessions:', err);
    }
  }, [filters.sectionsType]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      
      const [sessionsResponse, trainersResponse, clubsResponse, membershipsResponse] = await Promise.all([
        scheduleApi.getSessions(token, 1, 300, { only_my_sessions: filters.sectionsType === 'my' }),
        scheduleApi.getTrainers(token),
        clubsApi.getAll(token, 1, 100),
        membershipsApi.getActive(token),
      ]);

      const activeMembershipClubIds = new Set<number>(
        membershipsResponse.data.memberships.map((m: MembershipResponse) => m.club_id)
      );
      setHasActiveMembership(activeMembershipClubIds.size > 0);

      const mappedTrainings: Training[] = sessionsResponse.data.sessions
        .filter((s: SessionResponse) => activeMembershipClubIds.has(s.club_id))
        .map((s: SessionResponse) => ({
          id: s.id,
          section_name: s.section_name,
          group_name: s.group_name,
          trainer_name: s.coach_name,
          trainer_id: s.coach_id,
          trainer_photo_url: s.coach_photo_url,
          club_id: s.club_id,
          club_name: s.club_name,
          club_logo_url: s.club_logo_url,
          date: s.date,
          time: s.time,
          location: s.location || s.club_address,
          max_participants: s.max_participants,
          current_participants: s.participants_count,
          participants: [],
          notes: s.notes,
          is_booked: s.is_booked,
          is_in_waitlist: s.is_in_waitlist,
        }));

      const mappedClubs: Club[] = clubsResponse.data.clubs
        .filter((c: ClubResponse) => activeMembershipClubIds.has(c.id))
        .map((c: ClubResponse) => ({
          id: c.id,
          name: c.name,
        }));

      const mappedTrainers: Trainer[] = trainersResponse.data
        .filter((tr: TrainerResponse) => tr.club_id === null || activeMembershipClubIds.has(tr.club_id))
        .map((tr: TrainerResponse) => ({
          id: tr.id,
          name: tr.name,
          club_id: tr.club_id,
        }));

      setTrainings(mappedTrainings);
      setClubs(mappedClubs);
      setTrainers(mappedTrainers);
    } catch (err) {
      console.error('Failed to load schedule:', err);
      setError(t('schedule.error'));
    } finally {
      setLoading(false);
    }
  }, [filters.sectionsType, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => refreshSessions(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshSessions]);

  // Helper functions
  function formatDate(date: Date): string {
    // Use local date components to avoid timezone shift issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Filter trainings
  const filteredTrainings = useMemo(() => {
    let result = [...trainings];

    if (filters.clubId) {
      result = result.filter(t => t.club_id === filters.clubId);
    }

    if (filters.trainerId) {
      result = result.filter(t => t.trainer_id === filters.trainerId);
    }

    // Sort by date and time
    result.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return result;
  }, [trainings, filters]);

  // Get upcoming trainings for list view — next 7 days
  const upcomingTrainings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);
    
    // next 7 days (today + 6 days = 7 days total)
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 6);
    const next7DaysStr = formatDate(next7Days);
    
    return filteredTrainings
      .filter(t => t.date >= todayStr && t.date <= next7DaysStr);
  }, [filteredTrainings]);

  // Get trainings for selected date in calendar
  const selectedDateTrainings = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = formatDate(selectedDate);
    return filteredTrainings.filter(t => t.date === dateStr);
  }, [filteredTrainings, selectedDate]);

  // Get dates with trainings for calendar
  const trainingDates = useMemo(() => {
    return new Set(filteredTrainings.map(t => t.date));
  }, [filteredTrainings]);

  // Actions
  const handleBook = async (trainingId: number) => {
    if (!hasActiveMembership) {
      setShowNoMembershipModal(true);
      return;
    }
    if (actionInProgress) return;
    setActionInProgress(trainingId);

    const tg = window.Telegram?.WebApp;
    const token = tg?.initData || null;

    try {
      const training = trainings.find(tr => tr.id === trainingId);
      if (training?.max_participants) {
        const check = await scheduleApi.getParticipants(trainingId, token);
        if (check.data.max_participants && check.data.total >= check.data.max_participants) {
          if (tg) tg.showAlert(t('schedule.full'));
          await refreshSessions();
          setActionInProgress(null);
          return;
        }
      }

      const response = await scheduleApi.book(trainingId, token);
      if (response.data.success) {
        if (tg) tg.showAlert(response.data.message || t('schedule.bookingSuccess'));
      }
    } catch (err: unknown) {
      console.error('Failed to book training:', err);
      if (tg) tg.showAlert(getErrorMessage(err, t('schedule.bookingError')));
    } finally {
      await refreshSessions();
      setActionInProgress(null);
    }
  };

  const handleCancelBooking = async (trainingId: number) => {
    if (actionInProgress) return;
    setActionInProgress(trainingId);

    const tg = window.Telegram?.WebApp;
    const token = tg?.initData || null;

    try {
      const response = await scheduleApi.cancel(trainingId, token);
      if (response.data.success) {
        if (tg) tg.showAlert(response.data.message || t('schedule.cancelSuccess'));
      }
    } catch (err: unknown) {
      console.error('Failed to cancel booking:', err);
      if (tg) tg.showAlert(getErrorMessage(err, t('schedule.cancelError')));
    } finally {
      await refreshSessions();
      setActionInProgress(null);
    }
  };

  const handleWaitlist = async (trainingId: number) => {
    if (!hasActiveMembership) {
      setShowNoMembershipModal(true);
      return;
    }
    if (actionInProgress) return;
    setActionInProgress(trainingId);

    const tg = window.Telegram?.WebApp;
    const token = tg?.initData || null;

    try {
      const response = await scheduleApi.joinWaitlist(trainingId, token);
      if (response.data.success) {
        if (tg) tg.showAlert(response.data.message || t('schedule.waitlistSuccess'));
      }
    } catch (err: unknown) {
      console.error('Failed to join waitlist:', err);
      if (tg) tg.showAlert(getErrorMessage(err, t('schedule.waitlistError')));
    } finally {
      await refreshSessions();
      setActionInProgress(null);
    }
  };

  const handleShowParticipants = (training: Training) => {
    setSelectedTraining(training);
    setShowParticipantsModal(true);
  };

  const activeFiltersCount = [
    filters.clubId,
    filters.sectionsType !== 'all',
    filters.trainerId,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <Layout title={t('nav.schedule')}>
        <PageContainer>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600">{t('common.loading')}</div>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title={t('nav.schedule')}>
        <PageContainer>
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 text-white rounded-lg"
            >
              {t('common.retry')}
            </button>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  // Show empty state if user has no active memberships
  if (!hasActiveMembership) {
    return (
      <Layout title={t('nav.schedule')}>
        <PageContainer>
          <Card className="text-center py-10 px-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-linear-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard size={40} className="text-orange-500" />
            </div>

            {/* Content */}
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {t('schedule.noMembership.title')}
            </h2>
            <p className="text-gray-600 mb-8 max-w-xs mx-auto">
              {t('schedule.noMembership.emptyDescription')}
            </p>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/student/clubs')}
              className="btn-primary w-full max-w-xs mx-auto px-6 py-3 text-white rounded-xl hover:opacity-90 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-[rgb(11,60,111)]/20"
            
            >
              <ShoppingBag size={20} />
              {t('schedule.noMembership.buyButton')}
            </button>

            {/* Secondary info */}
            <p className="mt-6 text-sm text-gray-500">
              {t('schedule.noMembership.hint')}
            </p>
          </Card>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('nav.schedule')}>
      <PageContainer>
        {/* Tabs and Filter */}
        <div className="flex items-center justify-between mb-5">
          {/* Segmented Control */}
          <div className="flex bg-gray-100/80 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-5 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-200 ${
                activeTab === 'list'
                  ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {t('schedule.tabs.list')}
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-5 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-200 ${
                activeTab === 'calendar'
                  ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {t('schedule.tabs.calendar')}
            </button>
          </div>

          {/* Filter */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] text-[#6B7280] hover:text-[#111827] hover:bg-gray-50 transition-colors"
          >
            <Filter size={16} />
            <span>{t('schedule.filters')}</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 w-[18px] h-[18px] text-white text-[10px] rounded-full flex items-center justify-center font-medium" >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.clubId && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-[#111827] rounded-full text-[12px] font-medium">
                {clubs.find(c => c.id === filters.clubId)?.name}
                <button onClick={() => setFilters(f => ({ ...f, clubId: null }))} className="text-[#9CA3AF] hover:text-[#111827]">
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.trainerId && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-[#111827] rounded-full text-[12px] font-medium">
                {trainers.find(t => t.id === filters.trainerId)?.name}
                <button onClick={() => setFilters(f => ({ ...f, trainerId: null }))} className="text-[#9CA3AF] hover:text-[#111]">
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.sectionsType === 'my' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-[#111827] rounded-full text-[12px] font-medium">
                {t('schedule.filters.mySections')}
                <button onClick={() => setFilters(f => ({ ...f, sectionsType: 'all' }))} className="text-[#9CA3AF] hover:text-[#111]">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === 'list' ? (
          <div className="space-y-3">
            {upcomingTrainings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#9CA3AF] text-[14px]">{t('schedule.noTrainings')}</p>
              </div>
            ) : (
              upcomingTrainings.map((training) => (
                <TrainingCard
                  key={training.id}
                  training={training}
                  onBook={() => handleBook(training.id)}
                  onCancelBooking={() => handleCancelBooking(training.id)}
                  onWaitlist={() => handleWaitlist(training.id)}
                  onShowParticipants={() => handleShowParticipants(training)}
                  isActionInProgress={actionInProgress === training.id}
                />
              ))
            )}
          </div>
        ) : (
          <CalendarView
            trainings={filteredTrainings}
            trainingDates={trainingDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedDateTrainings={selectedDateTrainings}
            onBook={handleBook}
            onCancelBooking={handleCancelBooking}
            onWaitlist={handleWaitlist}
            onShowParticipants={handleShowParticipants}
            actionInProgress={actionInProgress}
          />
        )}

        {/* Modals */}
        {showFiltersModal && (
          <FiltersModal
            clubs={clubs}
            trainers={trainers}
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFiltersModal(false)}
          />
        )}

        {showNoMembershipModal && (
          <NoMembershipModal onClose={() => setShowNoMembershipModal(false)} />
        )}

        {showParticipantsModal && selectedTraining && (
          <ParticipantsModal
            training={selectedTraining}
            onClose={() => {
              setShowParticipantsModal(false);
              setSelectedTraining(null);
            }}
          />
        )}
      </PageContainer>
    </Layout>
  );
}
