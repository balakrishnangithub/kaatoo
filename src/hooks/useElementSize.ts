import { useEffect, useState, type RefObject } from 'react';

/**
 * An element's inner size, kept current as the layout changes (0×0 until it
 * is mounted). Play fields measure themselves with this so their contents
 * adapt to any screen instead of assuming one.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): { w: number; h: number } {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [ref]);
  return size;
}
