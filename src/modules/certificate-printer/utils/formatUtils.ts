/**
 * Pure formatting and sanitization utilities for Certificate rendering and printing
 */

export function formatDisplayDate(d?: string | null): string {
  if (!d) return '';
  const match = String(d).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const year = match[1];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${day}, ${year}`;
    }
  }
  return d;
}

// Clean redundant lead prefixes from stored or legacy descriptions
export function cleanDescription(rawDesc: string, recipient: string): string {
  if (!rawDesc) return '';
  let cleaned = rawDesc.trim();
  const escapedName = (recipient || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const duplicatePattern = new RegExp(
    `^(?:This\\s+(?:officially\\s+certifies\\s+that|is\\s+to\\s+(?:verify|certify)\\s+that|certifies\\s+that)|This\\s+letter\\s+is\\s+proudly\\s+presented\\s+to)\\s*(?:${escapedName})?\\s*`,
    'i'
  );
  if (duplicatePattern.test(cleaned)) {
    cleaned = cleaned.replace(duplicatePattern, '');
  }
  return cleaned;
}
