export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(path: string) {
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}

export function withoutBasePath(path: string) {
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
    return path.slice(basePath.length) || "/";
  }
  return path;
}

export function dashboardCallback(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\") || /[\u0000-\u001f]/.test(path)) return "/";
  const normalized = withoutBasePath(path);
  const pathname = normalized.split(/[?#]/)[0];
  return ["/", "/users", "/subscriptions", "/coupons", "/settings", "/settings/security"].includes(pathname) ? normalized : "/";
}
