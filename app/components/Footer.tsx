'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n';
import { useState, useRef, useEffect } from 'react';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    
    // Navigate to the new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
    setIsOpen(false);
  };

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-12">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Bianca Starling. {t('copyright')}
          </p>
          
          {/* Language Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-accent hover:text-accent"
              aria-label={t('switchLanguage')}
            >
              <Globe className="h-4 w-4" />
              <span>{localeNames[locale]}</span>
              <svg
                className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute bottom-full right-0 mb-2 min-w-[150px] overflow-hidden rounded-lg border border-border bg-white shadow-lg">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLanguageChange(loc)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      loc === locale
                        ? 'bg-accent text-white font-medium'
                        : 'text-foreground hover:bg-accent/10'
                    }`}
                  >
                    {localeNames[loc]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
