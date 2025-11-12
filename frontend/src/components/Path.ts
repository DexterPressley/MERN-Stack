const DEV_BASE = "http://localhost:3001"; // Changed from 8080
const PROD_HOST = "colorsdigitalocean.xyz";

export function buildPath(route: string): string {
  const r = route.replace(/^\/+/, "");
  if (import.meta.env.MODE !== "development") {
    return `https://${PROD_HOST}/${r}`;
  }
  return `${DEV_BASE}/${r}`;
}