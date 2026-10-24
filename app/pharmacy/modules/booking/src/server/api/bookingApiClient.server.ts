import type { paths } from '@crystal-pharm/api-client';
import { issueApiToken, type ApiTokenClaims } from '@crystal-pharm/auth';
import { readRequiredEnvironmentVariable } from '@crystal-pharm/auth/toolkit';
import createClient, { type Client } from 'openapi-fetch';

/** Au nom de qui le C# est appelé : le compte du Manager et son Tenant actif. */
export type BookingCaller = ApiTokenClaims;

export type BookingApiClient = Client<paths>;

/**
 * Un client du C#, côté serveur seulement, qui joint à chaque appel un jeton court
 * signé pour ce Manager. Le C# n'est jamais appelé depuis le navigateur.
 */
export function createBookingApiClient(caller: BookingCaller): BookingApiClient {
	const client = createClient<paths>({ baseUrl: readRequiredEnvironmentVariable('API_URL') });
	client.use({
		async onRequest({ request }) {
			request.headers.set('Authorization', `Bearer ${await issueApiToken('PHARMACY_URL', caller)}`);
			return request;
		}
	});
	return client;
}
