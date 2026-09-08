import { useEffect, useState } from 'react';
import { pickActiveLandingSection } from '@/lib/landingNav';

export function useScrollSpy(ids: readonly string[], enabled: boolean) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setActiveId(null);
      return;
    }

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const update = () => {
      const sections = elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return { id: el.id, top: rect.top, height: rect.height };
      });
      setActiveId(pickActiveLandingSection(sections, window.innerHeight));
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [enabled, ids]);

  return activeId;
}
