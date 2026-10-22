import type { Handle } from '@sveltejs/kit';
import { createAuthenticationHandle, type AuthenticationRedirects } from '../toolkit/authenticationHandle.server';
import { getCustomerBetterAuth } from './customerBetterAuth.server';

type CustomerAuthenticationOptions = AuthenticationRedirects & {
	baseUrlEnvironmentVariable: string;
};

export function createCustomerAuthenticationHandle({
	baseUrlEnvironmentVariable,
	...authenticationRedirects
}: CustomerAuthenticationOptions): Handle {
	return createAuthenticationHandle(
		() => getCustomerBetterAuth(baseUrlEnvironmentVariable),
		authenticationRedirects
	);
}
