import { storeInDevelopmentOutbox } from './developmentOutbox.server';
import type { Email } from './email';
import { renderEmailHtml } from './emailHtml';

const resendEndpoint = 'https://api.resend.com/emails';
const defaultSender = 'Crystal Pharm <bonjour@crystal-pharm.fr>';

/** Par Resend si `RESEND_API_KEY` existe ; sinon dans la boîte de dev, sans rien envoyer. */
export async function sendEmail(email: Email): Promise<void> {
	const resendApiKey = process.env.RESEND_API_KEY;
	if (!resendApiKey) {
		storeInDevelopmentOutbox(email);
		return;
	}

	const response = await fetch(resendEndpoint, {
		method: 'POST',
		headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			from: process.env.EMAIL_SENDER ?? defaultSender,
			to: [email.to],
			subject: email.subject,
			text: [email.text, ...email.actionLinks.map((actionLink) => `${actionLink.label} : ${actionLink.url}`)].join('\n\n'),
			html: renderEmailHtml(email)
		})
	});
	if (!response.ok) throw new Error(`Resend refused the email (status ${response.status}).`);
}
