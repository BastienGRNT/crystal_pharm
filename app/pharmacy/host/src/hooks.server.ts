import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createCustomerAuthenticationHandle } from '@crystal-pharm/auth';
import { createToolAccessHandle } from '@crystal-pharm/home/server';
import { protectedTools } from '$lib/toolLinks';

if (import.meta.env.DEV) {
	const [{ registerPharmacyDemoSeeder }, { seedPlanningDemoData }] = await Promise.all([
		import('@crystal-pharm/dev-tools'),
		import('@crystal-pharm/planning/server')
	]);
	registerPharmacyDemoSeeder(seedPlanningDemoData);
}

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
		anonymousOnlyPathnames: ['/login', '/register'],
		publicPathnamePrefixes: ['/__dev/', '/invitation/', '/rejoindre/', '/conditions/']
	}),
	createToolAccessHandle(protectedTools),
	preventCachingOfHealthData
);
