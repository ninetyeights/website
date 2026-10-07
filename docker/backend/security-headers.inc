# Static Next.js pages require inline hydration scripts and Motion uses inline styles.
# A strict nonce policy would require changing the rendering architecture.
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com; font-src 'self'; connect-src 'self' https://translate.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src https://docs.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self' https://docs.google.com; frame-ancestors 'none'" always;
add_header X-Frame-Options DENY always;
# Trial policy: report inline scripts without blocking hydration; keep inline styles for Motion.
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com; font-src 'self'; connect-src 'self' https://translate.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src https://docs.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self' https://docs.google.com; frame-ancestors 'none'; report-uri /api/security/csp-report" always;
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
