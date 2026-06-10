import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const languages = [
    { code: 'en', label: t('language.switcher.english', 'English'), flag: '🇬🇧' },
    { code: 'ta', label: t('language.switcher.tamil', 'Tamil'), flag: '🇮🇳' },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            border: language === lang.code ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
            background: language === lang.code ? 'var(--color-bg)' : 'transparent',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: language === lang.code ? '600' : '400',
            transition: 'all var(--transition-fast)',
          }}
          title={lang.label}
          aria-pressed={language === lang.code}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
