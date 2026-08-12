/**
 * Utility to safely register the application Service Worker for caching and PWA performance.
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Register on window load to avoid blocking initial paint
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] ServiceWorker registered with scope:', registration.scope);

        // Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[SW] New content is available; please refresh.');
              } else {
                console.log('[SW] Content cached for offline use.');
              }
            }
          };
        };
      })
      .catch((error) => {
        console.warn('[SW] ServiceWorker registration failed:', error);
      });
  });
}
