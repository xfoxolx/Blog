import { createContext, useContext, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';
const Ctx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') === 'light' ? 'light' : 'dark'));
  const toggle = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };
  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
/** Content pages opt into the light palette by adding this class to their root. Home stays dark. */
export const themeClass = (theme: Theme) => (theme === 'light' ? 'theme-light' : '');
