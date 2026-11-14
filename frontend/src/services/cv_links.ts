import type { MasterProfileData } from "../types/master_profile";
import type { GeneratedCVContent, GeneratedCVCertificateItem } from "../types/resume";

/**
 * Normalizes and validates an external URL so only safe http(s) links are rendered in CVs/PDFs.
 */
export function getSafeExternalUrl(rawUrl?: string | null): string | undefined {
  if (typeof rawUrl !== "string") return undefined;
  let candidate = rawUrl.trim();
  if (!candidate) return undefined;

  if (/^www\./i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      parsed.hostname &&
      !/\s/.test(parsed.hostname)
    ) {
      return candidate;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function normalizeKey(value?: string | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Backfills missing certificate URLs from the candidate's Master Profile and sanitizes
 * unsafe protocols so both newly generated and pre-existing IndexedDB CVs preserve links.
 */
export function hydrateCertificateUrls(
  content: GeneratedCVContent,
  masterProfile?: MasterProfileData | null,
): GeneratedCVContent {
  const certs = content.certificates;
  if (!Array.isArray(certs) || certs.length === 0) {
    return content;
  }

  const byNameIssuer = new Map<string, string>();
  const byName = new Map<string, string>();

  for (const mc of masterProfile?.certificates ?? []) {
    const safeUrl = getSafeExternalUrl(mc.url);
    if (!safeUrl) continue;

    const nameKey = normalizeKey(mc.name);
    const issuerKey = normalizeKey(mc.issuer);
    if (!nameKey) continue;

    if (!byName.has(nameKey)) {
      byName.set(nameKey, safeUrl);
    }
    if (issuerKey) {
      const compositeKey = `${nameKey}\0${issuerKey}`;
      if (!byNameIssuer.has(compositeKey)) {
        byNameIssuer.set(compositeKey, safeUrl);
      }
    }
  }

  let changed = false;
  const nextCerts: GeneratedCVCertificateItem[] = certs.map((cert) => {
    const safeExisting = getSafeExternalUrl(cert.url);
    if (safeExisting) {
      if (safeExisting !== cert.url) {
        changed = true;
        return { ...cert, url: safeExisting };
      }
      return cert;
    }

    const nameKey = normalizeKey(cert.name);
    const issuerKey = normalizeKey(cert.issuer);
    const matchedUrl =
      (issuerKey ? byNameIssuer.get(`${nameKey}\0${issuerKey}`) : undefined) ??
      byName.get(nameKey);

    if (matchedUrl) {
      changed = true;
      return { ...cert, url: matchedUrl };
    }

    if ("url" in cert && cert.url !== undefined) {
      changed = true;
      const { url: _ignored, ...rest } = cert;
      return rest;
    }

    return cert;
  });

  if (!changed) {
    return content;
  }

  return {
    ...content,
    certificates: nextCerts,
  };
}
