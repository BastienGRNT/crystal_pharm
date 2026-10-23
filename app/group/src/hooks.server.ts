import { createCustomerAuthenticationHandle } from '@crystal-pharm/auth';

// Pas d'inscription libre : un compte groupement se crée depuis une invitation.
export const handle = createCustomerAuthenticationHandle({
	baseUrlEnvironmentVariable: 'GROUP_URL',
	loginPathname: '/login',
	signedInHomePathname: '/',
	anonymousOnlyPathnames: ['/login'],
	publicPathnamePrefixes: ['/__dev/', '/invitation/']
});
