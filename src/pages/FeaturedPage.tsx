import PageNav from '../components/PageNav';
import Featured from '../components/Featured';
import { themeClass, useTheme } from '../lib/theme';

export default function FeaturedPage() {
  const { theme } = useTheme();

  return (
    <main className={`bg-bg text-text-primary font-body min-h-screen ${themeClass(theme)}`}>
      <PageNav />
      <div className="pt-20 md:pt-24">
        <Featured hideAction />
      </div>
    </main>
  );
}
