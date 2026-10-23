import { createCustomerAuthenticationHandle } from '@crystal-pharm/auth';

export const handle = createCustomerAuthenticationHandle({
	baseUrlEnvironmentVariable: 'GROUP_URL',
	loginPathname: '/login',
	signedInHomePathname: '/',
	anonymousOnlyPathnames: ['/login', '/register'],
	publicPathnamePrefixes: ['/__dev/']
});
