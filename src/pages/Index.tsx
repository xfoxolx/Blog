import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';
import Hero from '../components/Hero';
import About from '../components/About';
import Footer from '../components/Footer';

let booted = false;

export default function Index() {
  // 站内导航回来不再闪加载屏；整页刷新则重新播放一次
  const [isLoading, setIsLoading] = useState(!booted);

  return (
    <main className="bg-bg text-text-primary font-body min-h-screen">
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={() => { booted = true; setIsLoading(false); }} />}
      </AnimatePresence>
      <Hero started={!isLoading} />
      <About />
      <Footer />
    </main>
  );
}
