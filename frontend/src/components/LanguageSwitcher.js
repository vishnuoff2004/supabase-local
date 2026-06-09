import React from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  const switchLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher" role="radiogroup" aria-label={t('language.switcher.label') || 'Language selector'}>
      <button
        className={currentLang === 'en' ? 'active' : ''}
        onClick={() => switchLanguage('en')}
        aria-label={t('language.switcher.english')}
        role="radio"
        aria-checked={currentLang === 'en'}
      >
        EN
      </button>
      <button
        className={currentLang === 'hi' ? 'active' : ''}
        onClick={() => switchLanguage('hi')}
        aria-label={t('language.switcher.hindi')}
        role="radio"
        aria-checked={currentLang === 'hi'}
      >
        HI
      </button>
    </div>
  );
}

export default LanguageSwitcher;
