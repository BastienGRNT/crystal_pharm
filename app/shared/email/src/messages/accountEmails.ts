import type { Email } from '../sending/email';

type EmailVerificationCodeContent = { to: string; code: string; validForMinutes: number };

/** Le code qui prouve à l'inscription que l'adresse est bien celle de la personne. */
export function composeEmailVerificationCodeEmail({ to, code, validForMinutes }: EmailVerificationCodeContent): Email {
	return {
		to,
		subject: `${code} est votre code Crystal Pharm`,
		text: [
			'Bonjour,',
			`Voici votre code pour confirmer votre adresse email : ${code}`,
			`Il est valable ${validForMinutes} minutes. Si vous n’avez pas demandé la création d’un compte Crystal Pharm, ignorez simplement ce message.`
		].join('\n\n'),
		actionLinks: []
	};
}
