import type { ServerInit } from '@sveltejs/kit';
import { createCustomerAuthenticationHandle } from '@crystal-pharm/auth';
import { assertProductionSecretsAreStrong } from '@crystal-pharm/auth/toolkit';

export const init: ServerInit = () => {
	assertProductionSecretsAreStrong(['BETTER_AUTH_SECRET']);
};

// Pas d'inscription libre : un compte groupement se crée depuis une invitation.
export const handle = createCustomerAuthenticationHandle({
	baseUrlEnvironmentVariable: 'GROUP_URL',
	loginPathname: '/login',
	signedInHomePathname: '/',
	anonymousOnlyPathnames: ['/login'],
	publicPathnamePrefixes: ['/__dev/', '/invitation/']
});
