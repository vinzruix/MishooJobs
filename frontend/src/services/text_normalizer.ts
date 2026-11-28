/**
 * Normalizes legacy "Primer Empleo Real" wording (in any casing or extra whitespace)
 * to the standardized "Primer Empleo" display label.
 */
export function normalizeSeniorityDisplayText(text?: string | null): string {
  if (!text) return "";
  return text.replace(/\bprimer\s+empleo\s+real\b/gi, "Primer Empleo");
}
