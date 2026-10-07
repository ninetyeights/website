type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

/** Only fixed operation names; never pass user inputs or generated results. */
export function trackToolSuccess(tool: 'translate' | 'link-extract' | 'text-compare' | 'password' | 'timestamp') {
  (window as AnalyticsWindow).gtag?.('event', 'tool_success', { tool_name: tool });
}

export function analyticsWindow() {
  return window as AnalyticsWindow;
}
