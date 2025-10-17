const app_name = 'colorsdigitalocean.xyz';

export function buildPath(route: string): string {
  if (import.meta.env.MODE !== 'development') {
    return `https://${app_name}/${route.replace(/^\/+/, '')}`;
  } else {
    return `http://localhost:5000/${route.replace(/^\/+/, '')}`;
  }
}

