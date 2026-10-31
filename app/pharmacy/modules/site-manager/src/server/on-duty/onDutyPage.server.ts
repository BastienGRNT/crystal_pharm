import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { readTenantSiteContent } from '@crystal-pharm/content-db';
import { fail, type ActionFailure } from '@sveltejs/kit';
import { keepUpcomingPeriods, parseOnDutyPeriodDrafts, readOnDutyPeriodDrafts, toOnDutyPeriodDraft } from '../../domain/onDutyPeriods';
import { onDutyPeriodsFieldName, type OnDutyFailure, type OnDutyPageData, type OnDutySaved } from '../../pages/onDutyPageData';
import { requireActiveTenantId } from '../activeTenant.server';
import { saveOnDutyPeriods } from '../repositories/onDutyPeriodsRepository.server';

type OnDutyRequest = { locals: { user: AuthenticatedUser | null } };

export async function loadOnDutyPage({ locals }: OnDutyRequest): Promise<OnDutyPageData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const content = await readTenantSiteContent(tenantId);
	return {
		isSiteCreated: content !== undefined,
		periods: keepUpcomingPeriods(content?.onDutyPeriods ?? [], new Date()).map(toOnDutyPeriodDraft)
	};
}

export const onDutyActions = {
	default: async ({ locals, request }: OnDutyRequest & { request: Request }): Promise<OnDutySaved | ActionFailure<OnDutyFailure>> => {
		const tenantId = await requireActiveTenantId(locals.user);
		const drafts = parseOnDutyPeriodDrafts(String((await request.formData()).get(onDutyPeriodsFieldName) ?? '[]'));
		if (!drafts) return fail(400, { submittedPeriods: [], formError: 'Les gardes envoyées sont illisibles.' });

		const reading = readOnDutyPeriodDrafts(drafts, new Date());
		if (!reading.success) return fail(400, { submittedPeriods: drafts, formError: reading.formError });

		const isSaved = await saveOnDutyPeriods(tenantId, reading.periods);
		if (!isSaved) return fail(409, { submittedPeriods: drafts, formError: 'Enregistrez d’abord votre site pour déclarer des gardes.' });
		return { isSaved: true };
	}
};
