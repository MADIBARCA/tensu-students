import { useState, useEffect } from 'react';
import { Layout, PageContainer } from '@/components/Layout';
import { useI18n } from '@/i18n/i18n';
import { NextSessionsSection } from './components/NextSessionsSection';
import { LocationDistance } from './components/LocationDistance';
import { NoMembershipBanner } from './components/NoMembershipBanner';
import { membershipsApi } from '@/functions/axios/axiosFunctions';

export default function StudentMainPage() {
  const { t } = useI18n();
  const [hasActiveMembership, setHasActiveMembership] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const tgUser = window.Telegram?.WebApp.initDataUnsafe?.user;
  const userName = tgUser?.first_name || '';

  const getGreetingKey = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'home.greeting.morning';
    if (hour >= 12 && hour < 18) return 'home.greeting.day';
    return 'home.greeting.evening';
  };

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
        <div className="mb-6 mt-[-8px]">
          <h1 className="text-[28px] font-extrabold text-gray-900 tracking-tight leading-tight">
            {t(getGreetingKey(), { name: userName }).replace('  ', ' ')}
          </h1>
        </div>
        {!hasActiveMembership ? (
          <NoMembershipBanner />
        ) : (
          <>
            <LocationDistance />
            <NextSessionsSection />
          </>
        )}
      </PageContainer>
    </Layout>
  );
}
