// 专注模式偏好：字号档 / 行宽档 / 衬线开关，localStorage 持久，跨文章生效
export interface FocusPrefs {
  size: number;
  width: number;
  serif: boolean;
}

export const FOCUS_SIZES = [17, 19, 21];
export const FOCUS_WIDTHS = [680, 760, 860];
// 英文走 Instrument Serif（本站已有），中文走系统宋体系，零新增字体请求
export const SERIF_STACK =
  '"Instrument Serif", Georgia, "Songti SC", "STSong", "SimSun", serif';

const KEY = 'blog-focus-v1';
const DEFAULTS: FocusPrefs = { size: 1, width: 1, serif: false };

function clampInt(v: unknown, min: number, max: number, fb: number): number {
  return typeof v === 'number' && Number.isInteger(v)
    ? Math.min(max, Math.max(min, v))
    : fb;
}

export function loadFocus(): FocusPrefs {
  let raw: unknown = null;
  try {
    raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return { ...DEFAULTS };
  }
  if (!raw || typeof raw !== 'object') return { ...DEFAULTS };
  const p = raw as Partial<FocusPrefs>;
  return {
    size: clampInt(p.size, 0, FOCUS_SIZES.length - 1, DEFAULTS.size),
    width: clampInt(p.width, 0, FOCUS_WIDTHS.length - 1, DEFAULTS.width),
    serif: typeof p.serif === 'boolean' ? p.serif : DEFAULTS.serif,
  };
}

export function saveFocus(p: FocusPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // 隐私模式写失败就用内存值，不炸
  }
}
