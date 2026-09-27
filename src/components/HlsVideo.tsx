import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { site } from '../data';

/** Shared HLS background video (hero + footer reuse). */
export default function HlsVideo({
  flip = false,
  overlay = 'bg-black/20',
}: {
  flip?: boolean;
  overlay?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let hls: Hls | null = null;
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(site.heroVideo);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = site.heroVideo;
    }
    video.play().catch(() => {});
    return () => hls?.destroy();
  }, []);

  return (
    <>
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        className={`absolute left-1/2 top-1/2 min-h-full min-w-full object-cover -translate-x-1/2 -translate-y-1/2 ${
          flip ? 'scale-y-[-1]' : ''
        }`}
      />
      <div className={`absolute inset-0 ${overlay}`} />
    </>
  );
}
