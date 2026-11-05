export {
	signInAndOpen,
	registerAndOpen,
	signOutAndOpen,
	verifyEmailAndOpen,
	resendVerificationCode,
	emailVerificationPathname,
	type Credentials,
	type NewAccount
} from './client/authenticationClient';
export { readReturnPathname } from './client/returnPathname';
export { verificationCodeLength } from './customer/emailVerificationSettings';
