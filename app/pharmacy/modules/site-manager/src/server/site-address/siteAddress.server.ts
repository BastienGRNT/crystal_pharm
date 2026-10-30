import { findCurrentSiteSubdomain } from '@crystal-pharm/content-db';
import { numberSubdomain, suggestSubdomain } from '../../domain/siteSubdomain';
import { changeSiteSubdomain } from '../repositories/siteSubdomainRepository.server';
import { readUrlFromEnvironment } from '../siteUrlEnvironment.server';

const maximumSuggestionAttempts = 50;

/** Ce qui suit le sous-domaine dans l'adresse d'un site : `.site.localhost:8080` en dev. */
export function readSiteAddressSuffix(): string {
	return `.${readUrlFromEnvironment('SITE_URL').host}`;
}

export function toPublicSiteUrl(subdomain: string): string {
	const publicSiteUrl = readUrlFromEnvironment('SITE_URL');
	publicSiteUrl.hostname = `${subdomain}.${publicSiteUrl.hostname}`;
	return publicSiteUrl.href;
}

/** `undefined` tant que le site n'a pas d'adresse. */
export async function readPublicSiteUrlOfTenant(tenantId: string): Promise<string | undefined> {
	const subdomain = await findCurrentSiteSubdomain(tenantId);
	return subdomain && toPublicSiteUrl(subdomain);
}

/** Au premier enregistrement, le site reçoit une adresse tirée du nom de la pharmacie ; le Manager peut la changer ensuite. */
export async function ensureSiteSubdomain(tenantId: string, pharmacyName: string): Promise<void> {
	if (await findCurrentSiteSubdomain(tenantId)) return;
	const suggestedSubdomain = suggestSubdomain(pharmacyName);
	for (let attemptNumber = 1; attemptNumber <= maximumSuggestionAttempts; attemptNumber++) {
		const candidate = attemptNumber === 1 ? suggestedSubdomain : numberSubdomain(suggestedSubdomain, attemptNumber);
		if ((await changeSiteSubdomain(tenantId, candidate)) === 'changed') return;
	}
	throw new Error(`No free subdomain found for "${suggestedSubdomain}" after ${maximumSuggestionAttempts} attempts.`);
}
