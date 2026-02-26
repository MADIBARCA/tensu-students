/**
 * Format a phone number for display.
 * Handles Kazakhstan numbers (7xxxxxxxxxx) and international formats.
 * 
 * Examples:
 *   77019250756   → +7 (701) 925-07-56
 *   87019250756   → +7 (701) 925-07-56
 *   +77019250756  → +7 (701) 925-07-56
 *   992939444423  → +992 939 444 423
 */
export function formatPhone(raw: string | undefined | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');

  // Kazakhstan: 7XXXXXXXXXX or 8XXXXXXXXXX (11 digits starting with 7 or 8)
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    const code = digits.slice(1, 4);
    const p1 = digits.slice(4, 7);
    const p2 = digits.slice(7, 9);
    const p3 = digits.slice(9, 11);
    return `+7 (${code}) ${p1}-${p2}-${p3}`;
  }

  // 10 digits (no country code) — assume KZ
  if (digits.length === 10) {
    const code = digits.slice(0, 3);
    const p1 = digits.slice(3, 6);
    const p2 = digits.slice(6, 8);
    const p3 = digits.slice(8, 10);
    return `+7 (${code}) ${p1}-${p2}-${p3}`;
  }

  // Fallback: just add + and group by 3
  if (digits.length > 6) {
    return '+' + digits.replace(/(\d{1,3})(?=\d)/g, '$1 ').trim();
  }

  return raw;
}

/**
 * Get the tel: URI from a phone number (strips formatting).
 */
export function phoneHref(raw: string | undefined | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  // Ensure KZ numbers start with +7
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    return `tel:+7${digits.slice(1)}`;
  }
  return `tel:+${digits}`;
}

/**
 * Programmatically trigger a phone call.
 * Works reliably in Telegram Mini Apps WebView where
 * window.location.href = 'tel:...' is often blocked.
 */
export function makeCall(raw: string | undefined | null): void {
  if (!raw) return;
  const href = phoneHref(raw);
  if (!href) return;
  window.open(href, '_blank');
}
