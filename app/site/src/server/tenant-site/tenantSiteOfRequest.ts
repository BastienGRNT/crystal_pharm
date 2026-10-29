import { query } from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { findSiteRequest } from '../site-request/siteRequest';
import type { TenantSiteReading } from './readTenantSite.server';

export type TenantSiteOfRequest = (TenantSiteReading & { status: 'missing' | 'invalid' }) | {
  status: 'ready';
  tenantSite: Extract<TenantSiteReading, { status: 'ready' }>['tenantSite'];
  /** Figé sur le serveur et repris par le navigateur : la même garde, les mêmes horaires des deux côtés. */
  renderedAt: string;
};

/** Le site de l'adresse demandée ; le tenant ne vient que du Host, résolu en base par le middleware. */
export const getTenantSiteOfRequest = query(async (): Promise<TenantSiteOfRequest> => {
  'use server';
  const event = getRequestEvent();
  const siteRequest = findSiteRequest(event?.locals);
  if (!event || !siteRequest) return { status: 'missing' };

  const [{ readTenantSite }, { computePageCacheExpiry }, { setPageCacheContext }] = await Promise.all([
    import('./readTenantSite.server'),
    import('../cache/pageCacheExpiry'),
    import('../site-request/siteRequest'),
  ]);
  const reading = await readTenantSite(siteRequest.tenantId);
  if (reading.status !== 'ready') return reading;

  const renderedAt = new Date();
  const openingHours = reading.tenantSite.modules.openingHours;
  setPageCacheContext(event.locals, {
    displayedGroupId: reading.displayedGroupId,
    expiresAt: computePageCacheExpiry({
      now: renderedAt,
      siteAccessEndsAt: siteRequest.siteAccessEndsAt,
      weeklyOpeningSchedule: openingHours.enabled ? openingHours.data.weeklySchedule : undefined,
    }),
  });
  return { status: 'ready', tenantSite: reading.tenantSite, renderedAt: renderedAt.toISOString() };
}, 'tenant-site-of-request');
