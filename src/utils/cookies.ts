/**
 * Utility functions for managing browser cookies and user GDPR consent preferences.
 */

export interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
}

export interface CookieConsent {
  essential: true;
  analytics: boolean;
  performance: boolean;
  marketing: boolean;
  timestamp: string;
  version: number;
}

export const CONSENT_COOKIE_NAME = 'gur_cookie_consent';
export const CURRENT_CONSENT_VERSION = 1;

export const DEFAULT_CONSENT: CookieConsent = {
  essential: true,
  analytics: false,
  performance: false,
  marketing: false,
  timestamp: new Date().toISOString(),
  version: CURRENT_CONSENT_VERSION,
};

/**
 * Retrieve a cookie value by name.
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
}

/**
 * Set a cookie with given options.
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;

  const {
    days = 365,
    path = '/',
    domain,
    sameSite = 'Lax',
    secure = true,
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  cookieString += `; path=${path}`;
  if (domain) cookieString += `; domain=${domain}`;
  if (sameSite) cookieString += `; SameSite=${sameSite}`;
  if (secure && typeof window !== 'undefined' && window.location.protocol === 'https:') {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

/**
 * Delete a cookie by setting its expiration to the past.
 */
export function deleteCookie(name: string, path: string = '/', domain?: string): void {
  if (typeof document === 'undefined') return;
  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
  if (domain) cookieString += `; domain=${domain}`;
  document.cookie = cookieString;
}

/**
 * Get current cookie consent preferences.
 */
export function getCookieConsent(): CookieConsent | null {
  const cookieVal = getCookie(CONSENT_COOKIE_NAME);
  if (!cookieVal) return null;
  try {
    const parsed = JSON.parse(cookieVal) as CookieConsent;
    if (parsed && typeof parsed === 'object' && parsed.essential === true) {
      return parsed;
    }
  } catch (e) {
    // Malformed consent cookie
  }
  return null;
}

/**
 * Save user cookie consent preferences and emit change event.
 */
export function setCookieConsent(preferences: Partial<Omit<CookieConsent, 'essential' | 'timestamp' | 'version'>>): CookieConsent {
  const existing = getCookieConsent() || DEFAULT_CONSENT;
  const updatedConsent: CookieConsent = {
    ...existing,
    ...preferences,
    essential: true,
    timestamp: new Date().toISOString(),
    version: CURRENT_CONSENT_VERSION,
  };

  setCookie(CONSENT_COOKIE_NAME, JSON.stringify(updatedConsent), {
    days: 365,
    sameSite: 'Lax',
    path: '/',
  });

  notifyConsentChanged(updatedConsent);
  return updatedConsent;
}

/**
 * Check if the user has explicitly set their consent preferences.
 */
export function hasUserConsented(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Reset stored consent preferences.
 */
export function resetCookieConsent(): void {
  deleteCookie(CONSENT_COOKIE_NAME);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cookie-consent-reset'));
  }
}

/**
 * Broadcast consent changes to browser components.
 */
function notifyConsentChanged(consent: CookieConsent): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cookie-consent-updated', {
        detail: consent,
      })
    );
  }
}
