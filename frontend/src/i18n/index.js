import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  fr: {
    translation: frTranslations,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      // Auto-detect language based on country code in URL
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      checkWhitelist: true,
    },
  });

// Helper function to change language based on country
export const setLanguageByCountry = (country) => {
  const languageMap = {
    za: 'en', // South Africa - English
    cm: 'fr', // Cameroon - French
  };
  
  const language = languageMap[country?.toLowerCase()] || 'en';
  i18n.changeLanguage(language);
  return language;
};

export default i18n;
