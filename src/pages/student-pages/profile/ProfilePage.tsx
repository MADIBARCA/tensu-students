import { useState, useEffect, useCallback } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { useTelegram } from '@/hooks/useTelegram';
import { studentsApi } from '@/functions/axios/axiosFunctions';
import { UserInfoSection } from './components/UserInfoSection';
import { MembershipsSection } from './components/MembershipsSection';
import { MembershipHistorySection } from './components/MembershipHistorySection';
import { AttendanceHistorySection } from './components/AttendanceHistorySection';
import { PaymentHistorySection } from './components/PaymentHistorySection';
import { SettingsSection } from './components/SettingsSection';
import { EditProfileModal } from './components/EditProfileModal';
import { PaymentModal } from './components/PaymentModal';
import { FreezeMembershipModal } from './components/FreezeMembershipModal';
import type { StudentResponse, MembershipStatus } from '@/functions/axios/responses';

interface SelectedMembership {
  id: number;
  status: MembershipStatus;
  freeze_days_available?: number;
  freeze_days_used?: number;
  club_name: string;
  section_name?: string | null;
  end_date: string;
}

export default function ProfilePage() {
  const { t } = useI18n();
  const { user } = useTelegram();
  const [studentData, setStudentData] = useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<SelectedMembership | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStudentData = useCallback(async () => {
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      const response = await studentsApi.getMe(token);
      setStudentData(response.data);
    } catch (error) {
      console.error('Failed to load student data:', error);
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

  const handleSaveProfile = async (updatedData: { first_name: string; last_name?: string }) => {
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      if (!token) return;

      const response = await studentsApi.updateMe(updatedData, token);
      setStudentData(response.data);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      const tgApp = window.Telegram?.WebApp;
      if (tgApp) {
        tgApp.showAlert('Ошибка при обновлении профиля');
      }
    }
  };

  const handlePayment = (membership: SelectedMembership) => {
    setSelectedMembership(membership);
    setShowPaymentModal(true);
  };

  const handleFreeze = (membership: SelectedMembership) => {
    setSelectedMembership(membership);
    setShowFreezeModal(true);
  };

  const handleClubClick = (_clubId: number) => {
    // Navigate to club page or open modal
    // For now, just log it
    console.log('Club clicked:', _clubId);
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
          onPayment={handlePayment}
          onFreeze={handleFreeze}
          onClubClick={handleClubClick}
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

        {showPaymentModal && selectedMembership && (
          <PaymentModal
            membership={selectedMembership}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedMembership(null);
            }}
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
      </PageContainer>
    </Layout>
  );
}
