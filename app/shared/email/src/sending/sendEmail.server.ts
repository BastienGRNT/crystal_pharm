import { toDevelopmentMailboxHeaders } from './developmentOutbox.server';
import type { Email } from './email';
import { renderEmailHtml } from './emailHtml';
import { getSmtpTransport, isDevelopment } from './smtpTransport.server';

const defaultSender = 'Crystal Pharm <bonjour@crystal-pharm.fr>';

/** Par le relais SMTP (cf. `getSmtpTransport`) : en dev, l'email arrive dans la boîte de dev sans rien envoyer. */
export async function sendEmail(email: Email): Promise<void> {
	await getSmtpTransport().sendMail({
		from: process.env.EMAIL_SENDER ?? defaultSender,
		to: email.to,
		subject: email.subject,
		text: [email.text, ...email.actionLinks.map((actionLink) => `${actionLink.label} : ${actionLink.url}`)].join('\n\n'),
		html: renderEmailHtml(email),
		attachments: email.attachments?.map((attachment) => ({
			filename: attachment.fileName,
			content: attachment.content
		})),
		headers: isDevelopment() ? toDevelopmentMailboxHeaders(email) : undefined
	});
}
