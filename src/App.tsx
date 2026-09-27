import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LocaleProvider } from './i18n';
import { ThemeProvider } from './lib/theme';
import Index from './pages/Index';
import Archive from './pages/Archive';
import FeaturedPage from './pages/FeaturedPage';
import CategoriesPage from './pages/CategoriesPage';
import Post from './pages/Post';
import Notes from './pages/Notes';
import LiquidGlassFilter from './components/LiquidGlassFilter';
import Terminal from './components/Terminal';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <LocaleProvider>
      <ThemeProvider>
        {/* HashRouter：GitHub Pages 纯静态无 fallback，一行解决刷新 404 */}
        <HashRouter>
          <LiquidGlassFilter />
          <ScrollToTop />
          <Terminal />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/featured" element={<FeaturedPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/posts" element={<Archive />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/posts/:folder/:slug" element={<Post />} />
            <Route path="*" element={<Index />} />
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </LocaleProvider>
  );
}
