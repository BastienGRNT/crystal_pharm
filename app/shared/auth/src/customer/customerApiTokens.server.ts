import { getCustomerBetterAuth } from './customerBetterAuth.server';

export type ApiTokenClaims = {
	accountId: string;
	/** Le Tenant actif de la session, jamais un paramètre venu du navigateur. */
	tenantId: string;
};

/**
 * Un jeton court pour appeler le C# au nom d'un Manager, signé par les clés du JWKS
 * de l'app. Il ne quitte jamais le serveur : le navigateur n'appelle pas le C#.
 */
export async function issueApiToken(
	baseUrlEnvironmentVariable: string,
	{ accountId, tenantId }: ApiTokenClaims
): Promise<string> {
	const { token } = await getCustomerBetterAuth(baseUrlEnvironmentVariable).api.signJWT({
		body: { payload: { sub: accountId, tenantId } }
	});
	return token;
}
