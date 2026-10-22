import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createCustomerAuthenticationHandle } from '@crystal-pharm/auth';

const healthDataPathnamePrefixes = ['/booking', '/prescriptions'];

const preventCachingOfHealthData: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	const isHealthDataPage = healthDataPathnamePrefixes.some(
		(pathnamePrefix) => event.url.pathname === pathnamePrefix || event.url.pathname.startsWith(`${pathnamePrefix}/`)
	);
	if (isHealthDataPage) response.headers.set('Cache-Control', 'no-store');
	return response;
};

export const handle = sequence(
	createCustomerAuthenticationHandle({
		baseUrlEnvironmentVariable: 'PHARMACY_URL',
		loginPathname: '/login',
		signedInHomePathname: '/',
		anonymousOnlyPathnames: ['/login', '/register']
	}),
	preventCachingOfHealthData
);
