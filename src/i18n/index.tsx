import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import zh from './zh.json';
import en from './en.json';

export type Locale = 'zh' | 'en';
type Dict = Record<string, string | string[]>;

const DICTS: Record<Locale, Dict> = { zh: zh as Dict, en: en as Dict };

const Ctx = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (k: string) => string }>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => k,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem('locale') === 'zh' ? 'zh' : 'en'));

  useEffect(() => {
    localStorage.setItem('locale', locale);
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale]);

  const t = (k: string) => {
    const v = DICTS[locale][k];
    return Array.isArray(v) ? v.join(',') : (v ?? k);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx);
export const useList = (k: string): string[] => {
  const { locale } = useLocale();
  const v = DICTS[locale][k];
  return Array.isArray(v) ? v : [];
};
