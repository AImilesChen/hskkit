import { safeReturnTo } from './domain.ts';

export const SIGN_IN_NOTICE_PARAM = 'hskkit_signed_in';
export const GOOGLE_START_PATH = '/api/v1/auth/google/start';

export function signInReturnTo(value?: string | null) {
  // Keep nested query separators out of the outer OAuth URL. The production
  // adapter reconstructs decoded query values before passing them to Next.
  if (value?.startsWith('v1.')) {
    try {
      if (value.length > 8192 || !/^v1\.[A-Za-z0-9_-]+$/.test(value)) return '/account';
      const bytes = Uint8Array.from(atob(value.slice(3).replaceAll('-', '+').replaceAll('_', '/')), character => character.charCodeAt(0));
      value = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch { return '/account'; }
  }
  const safe = safeReturnTo(value, '/account');
  const url = new URL(safe, 'https://hskkit.local');
  // Do not return to another sign-in, callback or mutation endpoint.
  let path: string;
  try { path = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/'; }
  catch { return '/account'; }
  if (path.startsWith('//') || path.includes('\\') || /^\/(?:login|logout)(?:[/?#]|$)/i.test(path) || /^\/api(?:[/?#]|$)/i.test(path)) return '/account';
  url.searchParams.delete(SIGN_IN_NOTICE_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function encodeSignInReturnTo(value?: string | null) {
  const bytes = new TextEncoder().encode(signInReturnTo(value));
  return `v1.${btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`;
}

export function googleSignInHref(returnTo?: string | null, selectAccount = false) {
  const query = new URLSearchParams({ returnTo: encodeSignInReturnTo(returnTo) });
  if (selectAccount) query.set('selectAccount', '1');
  return `${GOOGLE_START_PATH}?${query}`;
}

export function signInReturnFromPage(path: string) {
  const url = new URL(path, 'https://hskkit.local');
  return signInReturnTo(url.pathname === '/login' ? url.searchParams.get('returnTo') : path);
}

export function canReuseGoogleSession(identity: { connection?: string | null; account?: { status: string } | null } | undefined, selectAccount: boolean) {
  return !selectAccount && identity?.connection === 'google' && identity.account?.status === 'active';
}

export function googleReturnDestination(returnTo: string, hasGuest: boolean) {
  const url = new URL(signInReturnTo(returnTo), 'https://hskkit.local');
  if (hasGuest && !/^\/account(?:\/|$)/.test(url.pathname)) url.searchParams.set(SIGN_IN_NOTICE_PARAM, '1');
  return `${url.pathname}${url.search}${url.hash}`;
}
