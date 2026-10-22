import { createAuthenticationHandle } from '@crystal-pharm/auth/toolkit';
import { getPlatformBetterAuth } from '$lib/server/authentication/platformBetterAuth.server';

export const handle = createAuthenticationHandle(getPlatformBetterAuth, {
	loginPathname: '/login',
	signedInHomePathname: '/',
	anonymousOnlyPathnames: ['/login', '/register']
});
