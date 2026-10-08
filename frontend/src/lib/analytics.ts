type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

export function installGoogleTag(target: AnalyticsWindow) {
  target.dataLayer = target.dataLayer ?? [];
  target.gtag = function () {
    // Google tag commands require an Arguments object, not a normal array.
    // eslint-disable-next-line prefer-rest-params
    target.dataLayer!.push(arguments);
  };
  return target.gtag;
}

/** Only fixed operation names; never pass user inputs or generated results. */
export function trackToolSuccess(tool: 'translate' | 'link-extract' | 'text-compare' | 'password' | 'timestamp') {
  (window as AnalyticsWindow).gtag?.('event', 'tool_success', { tool_name: tool });
}

export function analyticsWindow() {
  return window as AnalyticsWindow;
}
