'use client';

import { useEffect } from 'react';
import { analyticsWindow } from '@/lib/analytics';

export function GoogleAnalytics() {
  useEffect(() => {
    const controller = new AbortController();
    let removeClickListener: (() => void) | undefined;
    void fetch('/analytics/config', { signal: controller.signal }).then(response => response.json()).then(config => {
      if (controller.signal.aborted || !config || !/^G-[A-Z0-9]+$/.test(config.measurementId) || !config.domains.includes(location.hostname.toLowerCase())) return;
      const target = analyticsWindow();
      if (target.gtag) return;
      target.dataLayer = target.dataLayer ?? [];
      target.gtag = (...args: unknown[]) => { target.dataLayer!.push(args); };
      target.gtag('js', new Date());
      // GA4 enhanced measurement handles client-side history changes.
      target.gtag('config', config.measurementId, { allow_google_signals: false, allow_ad_personalization_signals: false });
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`;
      document.head.appendChild(script);
      const onClick = (event: MouseEvent) => {
        if (!(event.target instanceof Element)) return;
        const link = event.target.closest('a[href]');
        if (!(link instanceof HTMLAnchorElement)) return;
        const url = new URL(link.href);
        const download = url.pathname.match(/^\/downloads\/(audiodeviceswitcher|lyricdrop|magidesk)\/([a-z0-9-]+)$/);
        if (url.origin === location.origin && download) {
          target.gtag?.('event', 'project_download_click', { project_name: download[1], platform: download[2], transport_type: 'beacon' });
        } else if (url.hostname === 'github.com') {
          target.gtag?.('event', 'github_click', { page_path: location.pathname });
        } else if (location.pathname === '/feedback' && url.hostname === 'docs.google.com') {
          target.gtag?.('event', 'feedback_form_open');
        }
      };
      document.addEventListener('click', onClick);
      removeClickListener = () => document.removeEventListener('click', onClick);
    }).catch(() => { /* Analytics must never interrupt the site. */ });
    return () => { controller.abort(); removeClickListener?.(); };
  }, []);
  return null;
}
