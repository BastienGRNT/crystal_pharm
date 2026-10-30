import type { ServerInit } from '@sveltejs/kit';
import { assertProductionSecretsAreStrong, createAuthenticationHandle } from '@crystal-pharm/auth/toolkit';
import { getPlatformBetterAuth } from '$lib/server/authentication/platformBetterAuth.server';

export const init: ServerInit = () => {
	assertProductionSecretsAreStrong(['PLATFORM_AUTH_SECRET']);
};

export const handle = createAuthenticationHandle(getPlatformBetterAuth, {
	loginPathname: '/login',
	signedInHomePathname: '/',
	anonymousOnlyPathnames: ['/login', '/register'],
	publicPathnamePrefixes: ['/__dev/']
});
