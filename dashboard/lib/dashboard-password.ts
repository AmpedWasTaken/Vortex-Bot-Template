import { createHash, timingSafeEqual } from 'node:crypto';

function hash(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

export function isDashboardPasswordConfigured(): boolean {
  const expected = process.env['DASHBOARD_PASSWORD'];
  return Boolean(expected && expected.length >= 8);
}

export function verifyDashboardPassword(candidate: string): boolean {
  const expected = process.env['DASHBOARD_PASSWORD'];
  if (!expected || expected.length < 8) {
    return false;
  }
  try {
    return timingSafeEqual(hash(candidate), hash(expected));
  } catch {
    return false;
  }
}
