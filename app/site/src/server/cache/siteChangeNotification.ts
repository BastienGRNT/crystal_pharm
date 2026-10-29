export type SiteChangeNotification = { kind: 'tenant' | 'group'; id: string } | { kind: 'unknown' };

const notificationPattern = /^(tenant|group):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** Le payload posé par les triggers `tenant_site_changed` : `tenant:<uuid>` ou `group:<uuid>`. */
export function parseSiteChangeNotification(payload: string): SiteChangeNotification {
  const match = notificationPattern.exec(payload);
  return match ? { kind: match[1] as 'tenant' | 'group', id: match[2] as string } : { kind: 'unknown' };
}
