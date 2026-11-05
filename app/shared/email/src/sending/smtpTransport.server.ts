import { createTransport, type Transporter } from 'nodemailer';

const developmentMailboxSmtpUrl = 'smtp://localhost:1025';

let configuredTransport: Transporter | undefined;

/**
 * Le relais SMTP qui envoie sans rien garder (Scaleway TEM en prod). En dev, toujours la boîte de dev
 * (Mailpit), même si `SMTP_URL` est posé : rien ne part vers un vrai destinataire.
 */
export function getSmtpTransport(): Transporter {
	configuredTransport ??= isDevelopment() ? createDevelopmentMailboxTransport() : createRelayTransport();
	return configuredTransport;
}

export function isDevelopment(): boolean {
	return process.env.APP_ENV === 'development';
}

function createDevelopmentMailboxTransport(): Transporter {
	return createTransport(process.env.DEVELOPMENT_MAILBOX_SMTP_URL ?? developmentMailboxSmtpUrl);
}

function createRelayTransport(): Transporter {
	const smtpUrl = process.env.SMTP_URL;
	if (!smtpUrl) throw new Error('SMTP_URL is missing: no email can be sent.');
	// Le chiffrement n'est levé que pour un relais simulé sur le réseau interne (cf. docker/simulation).
	const allowsPlainText = process.env.SMTP_ALLOW_PLAIN_TEXT === 'true';
	const relayUrl = new URL(smtpUrl);
	const isImplicitTls = relayUrl.protocol === 'smtps:';
	return createTransport({
		host: relayUrl.hostname,
		port: Number(relayUrl.port) || (isImplicitTls ? 465 : 587),
		secure: isImplicitTls,
		requireTLS: !isImplicitTls && !allowsPlainText,
		ignoreTLS: allowsPlainText,
		auth: relayUrl.username
			? { user: decodeURIComponent(relayUrl.username), pass: decodeURIComponent(relayUrl.password) }
			: undefined
	});
}
