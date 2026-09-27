import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WORDS = ['Read', 'Think', 'Write'];

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const DURATION = 2700;
    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      setCount(Math.floor(p * 100));
      setWordIndex(Math.floor((now - start) / 900) % WORDS.length);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!done.current) {
        done.current = true;
        setTimeout(onComplete, 400);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-bg flex flex-col justify-between p-6 md:p-10"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.span
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-xs text-muted uppercase tracking-[0.3em]"
      >
        Blog
      </motion.span>

      <div className="flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.h1
            key={wordIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-4xl md:text-6xl lg:text-7xl font-display italic text-text-primary/80"
          >
            {WORDS[wordIndex]}
          </motion.h1>
        </AnimatePresence>
      </div>

      <div>
        <div className="flex justify-end mb-6">
          <span className="text-6xl md:text-8xl lg:text-9xl font-display text-text-primary tabular-nums">
            {String(count).padStart(3, '0')}
          </span>
        </div>
        <div className="h-[3px] bg-stroke/50 overflow-hidden">
          <div
            className="h-full w-full accent-gradient origin-left"
            style={{
              transform: `scaleX(${count / 100})`,
              boxShadow: '0 0 8px rgba(137, 170, 204, 0.35)',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
