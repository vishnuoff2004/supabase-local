import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockChangeLanguage = jest.fn();
let mockI18nLanguage = 'en';

jest.mock('../i18n', () => ({
  language: 'en',
  changeLanguage: mockChangeLanguage,
  on: jest.fn(),
  off: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: mockI18nLanguage, changeLanguage: mockChangeLanguage },
  }),
}));

const { LanguageProvider, useLanguage } = require('../contexts/LanguageContext');

function TestComponent() {
  const { language, changeLanguage } = useLanguage();
  return (
    <div>
      <span data-testid="current-language">{language}</span>
      <button onClick={() => changeLanguage('ta')}>Switch to Tamil</button>
      <button onClick={() => changeLanguage('en')}>Switch to English</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <LanguageProvider>
      <TestComponent />
    </LanguageProvider>
  );
}

describe('LanguageContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockI18nLanguage = 'en';
  });

  test('provides default language as en', () => {
    renderWithProvider();
    expect(screen.getByTestId('current-language').textContent).toBe('en');
  });

  test('switches language to Tamil', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByText('Switch to Tamil'));

    expect(screen.getByTestId('current-language').textContent).toBe('ta');
    expect(localStorage.getItem('language')).toBe('ta');
  });

  test('switches language to English', async () => {
    localStorage.setItem('language', 'ta');
    const user = userEvent.setup();
    renderWithProvider();

    expect(screen.getByTestId('current-language').textContent).toBe('ta');

    await user.click(screen.getByText('Switch to English'));

    expect(screen.getByTestId('current-language').textContent).toBe('en');
    expect(localStorage.getItem('language')).toBe('en');
  });

  test('throws error when useLanguage is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow('useLanguage must be used within LanguageProvider');
    consoleError.mockRestore();
  });
});
