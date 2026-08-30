/**
 * Validates that a given URL is a valid public HTTPS URL, protecting against SSRF attacks.
 */
export function validateExternalUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("URL is empty or invalid");
  }

  const cleaned = rawUrl.split("?")[0].trim();
  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    throw new Error(`Invalid URL: ${cleaned}`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`Only HTTPS URLs are allowed: ${cleaned}`);
  }

  const hostname = parsed.hostname;

  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^\[::1\]$/,
    /^\[fc/i,
    /^\[fd/i,
    /^\[fe80/i,
    /\.local$/i,
    /\.internal$/i,
    /\.localhost$/i,
  ];

  for (const pattern of privatePatterns) {
    if (pattern.test(hostname)) {
      throw new Error(`Private/internal URLs are not allowed: ${hostname}`);
    }
  }

  return rawUrl.trim();
}
