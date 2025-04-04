import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importa le risorse di traduzione
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import translationIT from './locales/it/translation.json';
import translationTR from './locales/tr/translation.json';
import translationRU from './locales/ru/translation.json';
import translationZH from './locales/zh/translation.json';
import translationFR from './locales/fr/translation.json';
import translationJA from './locales/ja/translation.json';
import translationAR from './locales/ar/translation.json';
import translationDE from './locales/de/translation.json';

// Le risorse di traduzione
const resources = {
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  },
  it: {
    translation: translationIT
  },
  tr: {
    translation: translationTR
  },
  ru: {
    translation: translationRU
  },
  zh: {
    translation: translationZH
  },
  fr: {
    translation: translationFR
  },
  ja: {
    translation: translationJA
  },
  ar: {
    translation: translationAR
  },
  de: {
    translation: translationDE
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Lingua predefinita
    fallbackLng: 'en', // Lingua di fallback
    interpolation: {
      escapeValue: false // React già si occupa dell'escape
    },
    react: {
      useSuspense: true
    }
  });

export default i18n;
