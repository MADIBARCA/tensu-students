import { useState, useEffect } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { CheckInSlider } from './components/CheckInSlider';
import { NextSessionsSection } from './components/NextSessionsSection';
import { LocationDistance } from './components/LocationDistance';
import { NoMembershipBanner } from './components/NoMembershipBanner';
import { attendanceApi, membershipsApi } from '@/functions/axios/axiosFunctions';

export default function StudentMainPage() {
  const { t } = useI18n();
  const [hasActiveMembership, setHasActiveMembership] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        const response = await membershipsApi.checkActive(token);
        setHasActiveMembership(response.data.has_active_membership);
      } catch (error) {
        console.error('Failed to check membership:', error);
        // If API fails, assume no membership
        setHasActiveMembership(false);
      } finally {
        setLoading(false);
      }
    };

    checkMembership();
  }, []);

  const handleCheckIn = async () => {
    if (checkingIn) return;
    
    setCheckingIn(true);
    try {
      const tg = window.Telegram?.WebApp;
      const token = tg?.initData || null;
      
      // Try to get location for check-in
      let latitude: number | undefined;
      let longitude: number | undefined;
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        // Location not available, continue without it
        console.log('Location not available for check-in');
      }
      
      const response = await attendanceApi.checkIn({ latitude, longitude }, token);
      
      // Show notification
      const tgApp = window.Telegram?.WebApp;
      if (tgApp) {
        if (response.data.success) {
          tgApp.showAlert(response.data.message || t('home.checkin.success'));
        } else {
          tgApp.showAlert(response.data.message || t('home.checkin.error'));
        }
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      const tgApp = window.Telegram?.WebApp;
      if (tgApp) {
        tgApp.showAlert(t('home.checkin.error'));
      }
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <Layout title={t('nav.home')}>
        <PageContainer>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-600">{t('common.loading')}</div>
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout title={t('nav.home')}>
      <PageContainer>
        {!hasActiveMembership ? (
          <NoMembershipBanner />
        ) : (
          <>
            <CheckInSlider onCheckIn={handleCheckIn} />
            <LocationDistance />
            <NextSessionsSection />
          </>
        )}
      </PageContainer>
    </Layout>
  );
}
