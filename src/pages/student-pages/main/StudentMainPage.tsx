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
      <Layout title="">
        <PageContainer className="bg-white min-h-dvh">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#8E8E93] border-t-transparent rounded-full animate-spin" />
          </div>
        </PageContainer>
      </Layout>
    );
  }

  // Current Date display like iOS
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
  const todayDateStr = new Date().toLocaleDateString('ru-RU', dateOptions).toUpperCase();

  return (
    <Layout title="">
      <PageContainer className="bg-white min-h-dvh">
        {/* iOS-style Large Title Header */}
        <div className="px-4 pt-4 pb-4">
          <p className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
            {todayDateStr}
          </p>
          <h1 className="text-[34px] font-bold text-[#000000] tracking-tight leading-none mb-4">
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
