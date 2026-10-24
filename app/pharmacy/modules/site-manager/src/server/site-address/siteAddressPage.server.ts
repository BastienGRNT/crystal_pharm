import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findCurrentSiteSubdomain } from '@crystal-pharm/content-db';
import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import { fail, type ActionFailure } from '@sveltejs/kit';
import { readSubdomainChoice, suggestSubdomain } from '../../domain/siteSubdomain';
import { subdomainFieldName, type SiteAddressChanged, type SiteAddressFailure, type SiteAddressPageData } from '../../pages/siteAddressPageData';
import { requireActiveTenantId } from '../activeTenant.server';
import { changeSiteSubdomain } from '../repositories/siteSubdomainRepository.server';
import { readSiteAddressSuffix, toPublicSiteUrl } from './siteAddress.server';

type SiteAddressRequest = { locals: { user: AuthenticatedUser | null } };

export async function loadSiteAddressPage({ locals }: SiteAddressRequest): Promise<SiteAddressPageData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const currentSubdomain = await findCurrentSiteSubdomain(tenantId);
	return {
		currentSubdomain,
		proposedSubdomain: currentSubdomain ?? suggestSubdomain((await getPharmacyProfile(tenantId)).name),
		addressSuffix: readSiteAddressSuffix(),
		publicSiteUrl: currentSubdomain && toPublicSiteUrl(currentSubdomain)
	};
}

export const siteAddressActions = {
	default: async ({
		locals,
		request
	}: SiteAddressRequest & { request: Request }): Promise<SiteAddressChanged | ActionFailure<SiteAddressFailure>> => {
		const tenantId = await requireActiveTenantId(locals.user);
		const submittedSubdomain = String((await request.formData()).get(subdomainFieldName) ?? '');
		const subdomainReading = readSubdomainChoice(submittedSubdomain);
		if (!subdomainReading.isValid) return fail(400, { submittedSubdomain, errorMessage: subdomainReading.errorMessage });

		const subdomainChange = await changeSiteSubdomain(tenantId, subdomainReading.subdomain);
		if (subdomainChange === 'taken') {
			return fail(409, { submittedSubdomain, errorMessage: 'Cette adresse est déjà prise par un autre site : choisissez-en une autre.' });
		}
		return { isChanged: true };
	}
};
