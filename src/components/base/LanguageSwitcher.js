'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const router = useRouter();
  const currentLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const languages = {
    en: { name: 'English', flag: '🇬🇧' },
    hi: { name: 'हिंदी', flag: '🇮🇳' },
    gu: { name: 'ગુજરાતી', flag: '🇮🇳' }
  };

  const switchLanguage = async (newLocale) => {
    // ✅ Cookie set karo (yeh important hai)
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    
    // ✅ Page refresh karo bina URL change kiye
    router.refresh(); // Next.js 13+ magic - refresh page without changing URL
    
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '5px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>{languages[currentLocale]?.flag || '🌐'}</span>
        <span>{languages[currentLocale]?.name || 'Language'}</span>
        <span>▼</span>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          marginTop: '5px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          {Object.entries(languages).map(([code, { name, flag }]) => (
            <button
              key={code}
              onClick={() => switchLanguage(code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                backgroundColor: currentLocale === code ? '#e0e0e0' : 'white',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <span>{flag}</span>
              <span>{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}