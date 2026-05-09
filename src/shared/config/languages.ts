export const LANGUAGE_CODES = ['en', 'ja', 'uz'] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  shortLabel: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', shortLabel: 'JA', flag: '🇯🇵' },
  { code: 'uz', label: "O'zbekcha", shortLabel: 'UZ', flag: '🇺🇿' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
