/**
 * Helper to construct clean API URLs supporting local dev and Cloud Run environments.
 */
export function getApiEndpoint(path: string): string {
  const envUrl = process.env.NEXT_PUBLIC_ATS_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
  const cleanEnvUrl = envUrl.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  
  if (cleanEnvUrl.endsWith("/api/v1")) {
    if (cleanPath.startsWith("api/v1/")) {
      return `${cleanEnvUrl}/${cleanPath.substring(7)}`;
    }
    return `${cleanEnvUrl}/${cleanPath}`;
  }
  
  if (cleanPath.startsWith("api/v1/")) {
    return `${cleanEnvUrl}/${cleanPath}`;
  }
  return `${cleanEnvUrl}/api/v1/${cleanPath}`;
}
