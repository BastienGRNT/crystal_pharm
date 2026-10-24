import { query } from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { findTenantIdOfRequest } from '../requestTenant';
import type { TenantSiteReading } from './readTenantSite.server';

export type TenantSiteOfRequest = (TenantSiteReading & { status: 'missing' | 'invalid' }) | {
  status: 'ready';
  tenantSite: Extract<TenantSiteReading, { status: 'ready' }>['tenantSite'];
  /** Figé sur le serveur et repris par le navigateur : la même garde, les mêmes horaires des deux côtés. */
  renderedAt: string;
};

/** Le site que la passerelle demande de servir ; le tenant ne vient que de son en-tête. */
export const getTenantSiteOfRequest = query(async (): Promise<TenantSiteOfRequest> => {
  'use server';
  const request = getRequestEvent()?.request;
  const tenantId = request && findTenantIdOfRequest(request);
  if (!tenantId) return { status: 'missing' };

  const { readTenantSite } = await import('./readTenantSite.server');
  const reading = await readTenantSite(tenantId);
  if (reading.status !== 'ready') return reading;
  return { ...reading, renderedAt: new Date().toISOString() };
}, 'tenant-site-of-request');
