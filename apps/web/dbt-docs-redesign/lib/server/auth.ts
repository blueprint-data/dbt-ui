import "server-only";
import { timingSafeEqual } from "node:crypto";

const API_KEY_HEADER = "x-api-key";
const REFRESH_API_KEY_ENV = "DBT_UI_MANIFEST_REFRESH_API_KEY";

function safeCompare(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    const padded = Buffer.alloc(expectedBuffer.length);
    timingSafeEqual(expectedBuffer, padded);
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function readManifestRefreshApiKey(): string | null {
  const value = process.env[REFRESH_API_KEY_ENV];
  if (!value || !value.trim()) {
    return null;
  }
  return value.trim();
}

export function isManifestRefreshAuthorized(request: Request): boolean {
  const expectedApiKey = readManifestRefreshApiKey();
  if (!expectedApiKey) {
    return false;
  }

  const providedApiKey = request.headers.get(API_KEY_HEADER);
  if (!providedApiKey) {
    return false;
  }

  return safeCompare(providedApiKey, expectedApiKey);
}

export { API_KEY_HEADER, REFRESH_API_KEY_ENV };
