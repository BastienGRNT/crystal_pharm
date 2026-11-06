import { readTenantSiteContent } from '@crystal-pharm/content-db';
import type { OnDutyPeriod } from '@crystal-pharm/schema';
import { keepUpcomingPeriods } from '../../domain/onDutyPeriods';

/** La garde en cours ou la prochaine, pour l'accueil ; `undefined` sans site ou sans garde à venir. */
export async function getNextOnDutyPeriod(tenantId: string, now: Date): Promise<OnDutyPeriod | undefined> {
	const content = await readTenantSiteContent(tenantId);
	return keepUpcomingPeriods(content?.onDutyPeriods ?? [], now)[0];
}
