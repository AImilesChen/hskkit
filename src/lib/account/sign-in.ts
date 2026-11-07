import { safeReturnTo } from './domain.ts';

export const SIGN_IN_NOTICE_PARAM = 'hskkit_signed_in';
export const GOOGLE_START_PATH = '/api/v1/auth/google/start';

export function signInReturnTo(value?: string | null) {
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

export function googleSignInHref(returnTo?: string | null, selectAccount = false) {
  const query = new URLSearchParams({ returnTo: signInReturnTo(returnTo) });
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
