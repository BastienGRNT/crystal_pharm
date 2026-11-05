import type { Handle } from '@sveltejs/kit';
import { createAuthenticationHandle, type AuthenticationRedirects } from '../toolkit/authenticationHandle.server';
import { getCustomerBetterAuth, type VerificationCodeSender } from './customerBetterAuth.server';

type CustomerAuthenticationOptions = AuthenticationRedirects & {
	baseUrlEnvironmentVariable: string;
	sendVerificationCode?: VerificationCodeSender;
};

export function createCustomerAuthenticationHandle({
	baseUrlEnvironmentVariable,
	sendVerificationCode,
	...authenticationRedirects
}: CustomerAuthenticationOptions): Handle {
	return createAuthenticationHandle(
		() => getCustomerBetterAuth({ baseUrlEnvironmentVariable, sendVerificationCode }),
		authenticationRedirects
	);
}
