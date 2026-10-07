'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAnimate } from 'motion/react-mini';

/** Animate existing page sections without remounting forms or hiding server HTML. */
export function PageEntrance({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const routeChanged = previousPath.current !== null && previousPath.current !== pathname;
    previousPath.current = pathname;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    // Let the browser restore scroll on reload/history without replaying an entrance.
    if (!routeChanged && (navigation?.type === 'reload' || navigation?.type === 'back_forward')) return;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) return;
    const main = scope.current?.querySelector('main');
    if (!main) return;
    let entrance: ReturnType<typeof animate> | undefined;
    const startEntrance = () => {
    const sections = Array.from(main.children).flatMap(element => {
      if (!(element instanceof HTMLElement) || element.getAttribute('aria-hidden') === 'true') return [];
      if (element.hasAttribute('data-entrance')) return [element];
      const marked = Array.from(element.querySelectorAll<HTMLElement>('[data-entrance]'));
      // Pages can opt into finer choreography; other sections share the same defaults.
      return marked.length ? marked.filter(item => !item.parentElement?.closest('[data-entrance]')) : [element];
    });
    if (!sections.length) return;
    const pageSections = new Map<Element, Map<Element, HTMLElement[]>>();
    for (const element of sections) {
      let pageSection: Element = element;
      while (pageSection.parentElement && pageSection.parentElement !== main) {
        pageSection = pageSection.parentElement;
      }
      const groups = pageSections.get(pageSection) ?? new Map<Element, HTMLElement[]>();
      const group = element.closest('[data-entrance-group]') ?? pageSection;
      const members = groups.get(group) ?? [];
      members.push(element);
      groups.set(group, members);
      pageSections.set(pageSection, groups);
    }
    const delays = new Map<HTMLElement, number>();
    let sectionIndex = 0;
    for (const groups of pageSections.values()) {
      let groupIndex = 0;
      for (const members of groups.values()) {
        const interval = Math.min(0.05, 0.15 / Math.max(1, members.length - 1));
        const start = sectionIndex * 0.12 + groupIndex * 0.04;
        members.forEach((element, index) => delays.set(element, start + index * interval));
        groupIndex += 1;
      }
      sectionIndex += 1;
    }
    entrance = animate(sections, { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] }, {
      duration: 0.32,
      ease: [0.25, 0.1, 0.25, 1],
      delay: index => delays.get(sections[index]) ?? 0,
    });
    };
    // Browser-local tools mount after hydration; collect their final panels once ready.
    const observer = new MutationObserver(() => {
      if (main.querySelector('[data-entrance-pending]')) return;
      observer.disconnect();
      if (!motionPreference.matches) startEntrance();
    });
    if (main.querySelector('[data-entrance-pending]')) {
      observer.observe(main, { childList: true, subtree: true });
    } else {
      startEntrance();
    }
    const finishForReducedMotion = () => { if (motionPreference.matches) entrance?.complete(); };
    motionPreference.addEventListener('change', finishForReducedMotion);
    return () => {
      motionPreference.removeEventListener('change', finishForReducedMotion);
      observer.disconnect();
      entrance?.complete();
    };
  }, [pathname, scope, animate]);

  return <div ref={scope} className="flex w-full flex-1 flex-col">{children}</div>;
}
