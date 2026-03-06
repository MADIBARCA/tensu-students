import React, { useState, useEffect } from 'react';
import { SectionHeader } from '@/components/Layout';
import { Card } from '@/components/ui';
import { useI18n } from '@/i18n/i18n';
import { MapPin, Globe, HelpCircle, FileText, Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/hooks/useTelegram';

export const SettingsSection: React.FC = () => {
  const { t, lang, setLang } = useI18n();
  const { openTgLink } = useTelegram();
  const navigate = useNavigate();
  const [locationAccess, setLocationAccess] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    // Load settings from API or localStorage
    const savedLocation = localStorage.getItem('location_access');
    
    if (savedLocation !== null) {
      setLocationAccess(savedLocation === 'true');
    }
  }, []);

  const handleLocationToggle = async (enabled: boolean) => {
    setLocationAccess(enabled);
    localStorage.setItem('location_access', enabled.toString());
    // TODO: Request geolocation permission and save to API
    // await studentsApi.updatePreferences({ location_access: enabled }, token);
  };

  const handleLanguageChange = async (newLang: 'ru' | 'kk' | 'en') => {
    setLang(newLang);
    setShowLangModal(false);
    // Sync language to backend so notifications arrive in the correct language
    try {
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        const { studentsApi } = await import('@/functions/axios/axiosFunctions');
        // Map frontend lang codes to backend codes (kk → kz)
        const backendLang = newLang === 'kk' ? 'kz' : newLang;
        await studentsApi.updatePrefs({ language: backendLang }, tg.initData);
      }
    } catch (e) {
      console.error('Failed to sync language preference:', e);
    }
  };

  return (
    <div className="mb-4">
      <SectionHeader title={t('profile.settings')} />
      <Card className="p-2 border border-gray-100 shadow-sm overflow-hidden">
        <div className="space-y-1">
          {/* Geolocation */}
          <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-[#1E3A8A]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">{t('settings.location')}</p>
                <p className="text-xs text-gray-500">{t('settings.location.desc')}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={locationAccess}
                onChange={(e) => handleLocationToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E3A8A] shadow-inner"></div>
            </label>
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Language */}
          <button
            onClick={() => setShowLangModal(true)}
            className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Globe size={16} className="text-[#1E3A8A]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">{t('settings.language')}</p>
                <p className="text-xs text-gray-500">
                  {lang === 'ru' ? t('language.russian') : lang === 'kk' ? t('language.kazakh') : t('language.english')}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Support */}
          <button
            onClick={() => {
              openTgLink('https://t.me/tensuadmin'); // Replace with actual support
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <HelpCircle size={16} className="text-[#1E3A8A]" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{t('settings.support')}</p>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Privacy Policy */}
          <button
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Shield size={16} className="text-gray-500" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{t('settings.privacy')}</p>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          {/* Terms of Service */}
          <button
            onClick={() => {
              window.open('https://tensu.kz/terms', '_blank');
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-gray-500" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{t('settings.terms')}</p>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>
      </Card>

      {/* Language Selection Modal */}
      {showLangModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-xl p-4">
            <h3 className="text-lg font-semibold mb-4">{t('language.change')}</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleLanguageChange('ru')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  lang === 'ru'
                    ? 'border-[#2563EB] bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">{t('language.russian')}</p>
              </button>
              <button
                onClick={() => handleLanguageChange('kk')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  lang === 'kk'
                    ? 'border-[#2563EB] bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">{t('language.kazakh')}</p>
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  lang === 'en'
                    ? 'border-[#2563EB] bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium">{t('language.english')}</p>
              </button>
            </div>
            <button
              onClick={() => setShowLangModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
