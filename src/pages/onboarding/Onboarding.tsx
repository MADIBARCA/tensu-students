import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/hooks/useTelegram';
import type { TelegramContactResult } from '@/hooks/useTelegram';
import { studentsApi } from '@/functions/axios/axiosFunctions';
import { useI18n } from '@/i18n/i18n';
import { 
  Phone, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Calendar,
  TrendingUp,
  Dumbbell,
  ArrowRight,
  Sparkles
} from 'lucide-react';

type OnboardingState = 'checking' | 'welcome' | 'requesting' | 'creating' | 'success' | 'error';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const { t } = useI18n();
  
  const [state, setState] = useState<OnboardingState>('checking');
  const [error, setError] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [contactData, setContactData] = useState<TelegramContactResult | null>(null);

  // Smooth card appearance
  useEffect(() => {
    const timer = setTimeout(() => setShowCard(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Check if user already exists
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData || null;
        
        if (!token) {
          setState('welcome');
          return;
        }

        const response = await studentsApi.getMe(token);
        if (response.data && response.data.id) {
          // User exists, navigate to main
          navigate('/student/main', { replace: true });
        } else {
          setState('welcome');
        }
      } catch {
        // User doesn't exist, show welcome screen
        setState('welcome');
      }
    };

    if (user !== null) {
      checkExistingUser();
    }
  }, [user, navigate]);

  // Request phone contact from Telegram
  const requestPhoneContact = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.requestContact) {
      setError('Telegram contact request is not available');
      setState('error');
      return;
    }

    setState('requesting');
    
    tg.requestContact((granted: boolean, result: TelegramContactResult) => {
      if (granted && result?.responseUnsafe?.contact?.phone_number) {
        const rawPhone = result.responseUnsafe.contact.phone_number;
        setPhone(rawPhone);
        setContactData(result);
      } else {
        setState('welcome');
      }
    });
  }, []);

  // Create student after contact is received
  useEffect(() => {
    if (!contactData?.response) return;

    const createStudent = async () => {
      setState('creating');
      
      try {
        const tg = window.Telegram?.WebApp;
        const token = tg?.initData;
        
        if (!token) {
          throw new Error('No authentication token');
        }

        const userLang = (tg?.initDataUnsafe?.user as { language_code?: string })?.language_code || 'ru';
        
        await studentsApi.create(
          { 
            contact_init_data: contactData.response,
            preferences: {
              language: userLang,
              notifications: true,
              dark_mode: false,
            }
          },
          token
        );

        setState('success');
        
        // Navigate after showing success
        setTimeout(() => {
          navigate('/student/main', { replace: true });
        }, 1500);
      } catch (err: unknown) {
        console.error('Error creating student:', err);
        const { getErrorMessage } = await import('@/lib/utils/errorHandler');
        const errorMessage = getErrorMessage(err, 'Не удалось создать профиль');
        setError(errorMessage);
        setState('error');
      }
    };

    createStudent();
  }, [contactData, navigate]);

  // Get full name from Telegram user
  const fullName = user 
    ? [user.first_name, user.last_name].filter(Boolean).join(' ')
    : '';

  // Loading/Checking state
  if (state === 'checking' || user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/90 text-lg font-medium animate-pulse">
            {t('onboarding.loading')}
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-green-600 to-emerald-700">
        <div className="text-center px-8">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {t('onboarding.success')}
          </h1>
          <p className="text-white/80">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 via-red-600 to-rose-700 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('onboarding.error.title')}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {error || 'An error occurred during registration'}
          </p>
          <button
            onClick={() => {
              setError(null);
              setContactData(null);
              setPhone(null);
              setState('welcome');
            }}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            {t('onboarding.error.retry')}
          </button>
        </div>
      </div>
    );
  }

  // Creating state
  if (state === 'creating' || state === 'requesting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="text-center px-8">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/30 rounded-full mx-auto" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-white border-t-transparent rounded-full mx-auto animate-spin" />
          </div>
          <p className="text-white/90 text-lg font-medium mt-6">
            {state === 'creating' ? t('onboarding.processing') : t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  // Welcome state - main onboarding UI
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Decorative circles */}
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/30 rounded-full blur-3xl" />
        <div className="absolute top-[30%] left-[10%] w-[20vw] h-[20vw] bg-purple-500/20 rounded-full blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 py-8">
        {/* Logo/Branding */}
        <div className={`text-center mb-8 transition-all duration-700 ${showCard ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            TENSU
          </h1>
          <p className="text-blue-200 text-sm">
            Sports Club App
          </p>
        </div>

        {/* Main Card */}
        <div 
          className={`bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden transition-all duration-700 delay-150 ${
            showCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* User greeting */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
            {user?.photo_url && (
              <img 
                src={user.photo_url} 
                alt={fullName}
                className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
              />
            )}
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {t('onboarding.welcome')}, {user?.first_name || 'User'}!
            </h2>
            <p className="text-gray-600 text-sm">
              {t('onboarding.subtitle')}
            </p>
          </div>

          {/* Features */}
          <div className="px-8 py-6 bg-gray-50/50">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">{t('onboarding.features.schedule')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">{t('onboarding.features.training')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-700">{t('onboarding.features.progress')}</span>
              </div>
            </div>
          </div>

          {/* Phone display */}
          {phone && (
            <div className="px-8 py-4 bg-green-50 border-y border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium">Номер подтверждён</p>
                  <p className="text-sm font-semibold text-gray-900">{phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="px-8 py-6">
            {!phone ? (
              <button
                onClick={requestPhoneContact}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
              >
                <Phone className="w-5 h-5" />
                <span>{t('onboarding.sharePhone')}</span>
                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/student/main', { replace: true })}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 group"
              >
                <span>{t('onboarding.continue')}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            
            <p className="text-xs text-gray-500 text-center mt-4">
              {t('onboarding.phoneRequired')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center mt-6 transition-all duration-700 delay-300 ${showCard ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white/60 text-xs">
            © 2024 Tensu. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
