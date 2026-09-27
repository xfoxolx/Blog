// SVG 折射滤镜单例：在 App 根挂载一次，导航胶囊通过 backdrop-filter: url(#liquid-glass) 引用。
// 手法参考 rdev/shuding 等开源实现：feTurbulence 造有机噪声 → feDisplacementMap 扭曲背影。
export default function LiquidGlassFilter() {
  return (
    <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <filter
          id="liquid-glass"
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.5" result="smooth" />
          <feDisplacementMap in="SourceGraphic" in2="smooth" scale="14" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
