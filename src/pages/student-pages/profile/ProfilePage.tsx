import { useState, useEffect, useCallback } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { useTelegram } from '@/hooks/useTelegram';
import { studentsApi } from '@/functions/axios/axiosFunctions';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { UserInfoSection } from './components/UserInfoSection';
import { MembershipsSection } from './components/MembershipsSection';
import { MembershipHistorySection } from './components/MembershipHistorySection';
import { AttendanceHistorySection } from './components/AttendanceHistorySection';
import { PaymentHistorySection } from './components/PaymentHistorySection';

import { SettingsSection } from './components/SettingsSection';
import { EditProfileModal } from './components/EditProfileModal';
import { MembershipDetailsModal } from './components/MembershipDetailsModal';

import { FreezeMembershipModal } from './components/FreezeMembershipModal';
import type { StudentResponse } from '@/functions/axios/responses';

import type { MembershipDetail } from './components/MembershipDetailsModal';
import { ClubDetailsModal } from '../clubs/components/ClubDetailsModal';
import type { Club } from '../clubs/ClubsPage';

export default function ProfilePage() {
  const { t } = useI18n();
  const { user } = useTelegram();
  const [studentData, setStudentData] = useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<MembershipDetail | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStudentData = useCallback(async () => {
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      const response = await studentsApi.getMe(token);
      setStudentData(response.data);
    } catch (error) {
      console.error('Failed to load student data:', error);
      const tgApp = window.Telegram?.WebApp;
      if (tgApp) {
        tgApp.showAlert(getErrorMessage(error, 'Не удалось загрузить данные профиля'));
      }
      // If API fails, don't set mock data in production
      // Just show the data from Telegram user if available
      if (user) {
        setStudentData({
          id: 0,
          telegram_id: user?.id || 0,
          first_name: user?.first_name || '',
          last_name: user?.last_name || null,
          phone_number: user?.phone_number || '',
          username: user?.username || null,
          photo_url: (user?.photo_url && typeof user.photo_url === 'string') ? user.photo_url : null,
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async (updatedData: { first_name: string; last_name: string }) => {
    const tg = window.Telegram?.WebApp;
    const token = tg?.initData || null;
    if (!token) return;

    try {
      await studentsApi.updateMe(updatedData, token);
    } catch (error) {
      console.error('Failed to update profile:', error);
      tg?.showAlert(t('profile.errors.updateFailed'));
      return;
    }

    setStudentData((prev) => prev ? { 
      ...prev, 
      first_name: updatedData.first_name,
      last_name: updatedData.last_name || null,
    } : prev);
    setShowEditModal(false);
    tg?.showAlert(t('profile.saved'));
  };



  const handleManage = (membership: MembershipDetail) => {
    setSelectedMembership(membership);
    setShowDetailsModal(true);
  };

  const handleRenew = (membership: MembershipDetail) => {
    setShowDetailsModal(false);
    setSelectedClub({
      id: membership.club_id,
      name: membership.club_name,
      address: null,
      sections_count: 0,
      students_count: 0,
      tags: [],
    });
  };

  const handleFreezeSuccess = () => {
    // Refresh membership data
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <Layout title={t('nav.profile')}>
        <PageContainer>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600">{t('common.loading')}</div>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('nav.profile')}>
      <PageContainer>
        {/* User Info Section */}
        <UserInfoSection
          student={studentData}
          onEdit={handleEditProfile}
        />

        {/* My Memberships Section */}
        <MembershipsSection
          key={`memberships-${refreshKey}`}
          onManage={handleManage}
        />

        {/* Membership History Section */}
        <MembershipHistorySection key={`history-${refreshKey}`} />

        {/* Attendance History Section */}
        <AttendanceHistorySection />

        {/* Payment History Section */}
        <PaymentHistorySection />


        {/* Settings Section */}
        <SettingsSection />

        {/* Modals */}
        {showEditModal && studentData && (
          <EditProfileModal
            student={studentData}
            onClose={() => setShowEditModal(false)}
            onSave={handleSaveProfile}
          />
        )}

        {showDetailsModal && selectedMembership && (
          <MembershipDetailsModal
            membership={selectedMembership}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedMembership(null);
            }}
            onFreeze={() => setShowFreezeModal(true)}
            onRenew={handleRenew}
          />
        )}


        {showFreezeModal && selectedMembership && (
          <FreezeMembershipModal
            membership={selectedMembership}
            onClose={() => {
              setShowFreezeModal(false);
              setSelectedMembership(null);
            }}
            onSuccess={handleFreezeSuccess}
          />
        )}

        {selectedClub && (
          <ClubDetailsModal
            club={selectedClub}
            initialTab="memberships"
            onClose={() => setSelectedClub(null)}
          />
        )}
      </PageContainer>
    </Layout>
  );
}
