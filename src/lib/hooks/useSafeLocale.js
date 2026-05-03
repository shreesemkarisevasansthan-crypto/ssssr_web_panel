'use client';

import { useLocale } from 'next-intl';

export function useSafeLocale() {
  try {
    const locale = useLocale();
    return locale || 'en';
  } catch (error) {
    console.warn('Intl context not found, defaulting to en');
    return 'en';
  }
}