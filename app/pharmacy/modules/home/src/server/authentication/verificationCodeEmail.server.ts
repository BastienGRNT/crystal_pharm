import type { VerificationCodeSender } from '@crystal-pharm/auth';
import { composeEmailVerificationCodeEmail, sendEmail } from '@crystal-pharm/email';

const verificationCodeValidForMinutes = 10;

export const sendRegistrationVerificationCode: VerificationCodeSender = ({ email, code }) =>
	sendEmail(composeEmailVerificationCodeEmail({ to: email, code, validForMinutes: verificationCodeValidForMinutes }));
