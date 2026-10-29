import { summarizeToolAccess, type ToolAccessLine } from '@crystal-pharm/billing-db/domain';
import { connectToSiteDatabase } from '../database/siteDatabase.server';

/** Ce que l'adresse demandée dit du site à servir. */
export type SiteAccessOfSubdomain =
  | { status: 'unknownAddress' }
  | { status: 'formerAddress'; currentSubdomain: string }
  | { status: 'siteNotSubscribed' }
  | { status: 'available'; tenantId: string; siteAccessEndsAt: Date };

type SiteAccessRow = {
  tenant_id: string;
  current_subdomain: string;
  tool_key: string | null;
  paid_until: Date | null;
  ends_at: Date | null;
};

/**
 * Le premier aller-retour : une seule instruction, sans transaction explicite. Le Tenant
 * se déduit de l'adresse seule ; les deux fonctions posent chacune leur contexte de
 * Row-Level Security. Un Tenant sans droit ne donne qu'une ligne vide à droite.
 */
export async function readSiteAccessOfSubdomain(requestedSubdomain: string, now = new Date()): Promise<SiteAccessOfSubdomain> {
  const rows = await connectToSiteDatabase()<SiteAccessRow[]>`
    select site.tenant_id, site.current_subdomain, access.tool_key, access.paid_until, access.ends_at
    from content.find_site_of_subdomain(${requestedSubdomain}) as site
    left join lateral billing.read_tool_access(site.tenant_id) as access on true`;
  const [firstRow] = rows;
  if (!firstRow) return { status: 'unknownAddress' };
  if (firstRow.current_subdomain !== requestedSubdomain) return { status: 'formerAddress', currentSubdomain: firstRow.current_subdomain };

  const siteAccessLine = summarizeToolAccessOfSite(rows, now);
  if (!siteAccessLine) return { status: 'siteNotSubscribed' };
  return { status: 'available', tenantId: firstRow.tenant_id, siteAccessEndsAt: siteAccessLine.endsAt };
}

// Plusieurs lignes `site` possibles (un Tool accordé par l'abonnement et par un groupement) : la fin la plus tardive l'emporte.
function summarizeToolAccessOfSite(rows: SiteAccessRow[], now: Date): ToolAccessLine | undefined {
  const siteLines: ToolAccessLine[] = rows
    .filter((row): row is SiteAccessRow & { tool_key: 'site'; paid_until: Date; ends_at: Date } => row.tool_key === 'site' && row.paid_until !== null && row.ends_at !== null)
    .map((row) => ({ toolKey: 'site', paidUntil: new Date(row.paid_until), endsAt: new Date(row.ends_at) }));
  if (!summarizeToolAccess(siteLines, now).accessibleToolKeys.includes('site')) return undefined;
  return siteLines.filter((line) => line.endsAt > now).reduce((latest, line) => (line.endsAt > latest.endsAt ? line : latest));
}
