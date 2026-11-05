import type { Email, EmailActionLink, SentEmail } from './email';

// La boîte de dev (Mailpit, cf. compose.yml) reçoit tout ce que les apps de dev envoient ;
// l'outil de dev la lit par son API. Ses liens d'action voyagent dans un en-tête de dev seulement.
const developmentMailboxUrl = process.env.DEVELOPMENT_MAILBOX_URL ?? 'http://localhost:8025';
const actionLinksHeader = 'X-Development-Action-Links';
const listedEmailCount = 20;

type MailboxSummary = { ID: string; Created: string };
type MailboxMessage = { To: { Address: string }[]; Subject: string; Text: string };

export function toDevelopmentMailboxHeaders(email: Email): Record<string, string> {
	return { [actionLinksHeader]: Buffer.from(JSON.stringify(email.actionLinks), 'utf8').toString('base64') };
}

/** Les derniers emails reçus par la boîte de dev, du plus récent au plus ancien ; aucun si elle ne répond pas. */
export async function readDevelopmentOutbox(): Promise<SentEmail[]> {
	try {
		const { messages } = await fetchFromMailbox<{ messages: MailboxSummary[] }>(`/api/v1/messages?limit=${listedEmailCount}`);
		return await Promise.all(messages.map(readSentEmail));
	} catch {
		return [];
	}
}

export async function clearDevelopmentOutbox(): Promise<void> {
	try {
		await fetch(`${developmentMailboxUrl}/api/v1/messages`, { method: 'DELETE' });
	} catch {
		// Une boîte de dev éteinte n'a rien à vider.
	}
}

async function readSentEmail(summary: MailboxSummary): Promise<SentEmail> {
	const [message, headers] = await Promise.all([
		fetchFromMailbox<MailboxMessage>(`/api/v1/message/${summary.ID}`),
		fetchFromMailbox<Record<string, string[]>>(`/api/v1/message/${summary.ID}/headers`)
	]);
	return {
		to: message.To.map((recipient) => recipient.Address).join(', '),
		subject: message.Subject,
		text: withoutActionLinkLines(message.Text),
		actionLinks: parseActionLinks(headers[actionLinksHeader]?.[0]),
		sentAt: summary.Created
	};
}

async function fetchFromMailbox<Response>(path: string): Promise<Response> {
	const response = await fetch(`${developmentMailboxUrl}${path}`);
	if (!response.ok) throw new Error(`The development mailbox answered ${response.status}.`);
	return (await response.json()) as Response;
}

// Le texte envoyé finit par « libellé : lien » pour chaque lien : la boîte de dev les montre déjà en liens.
// SMTP fait voyager les fins de ligne en CRLF : on les ramène à LF avant de les reconnaître.
function withoutActionLinkLines(text: string): string {
	return text
		.replace(/\r\n/g, '\n')
		.replace(/(?:\n\n[^\n]+ : https?:\/\/\S+)+\s*$/, '')
		.trim();
}

function parseActionLinks(encodedActionLinks: string | undefined): EmailActionLink[] {
	if (!encodedActionLinks) return [];
	try {
		return JSON.parse(Buffer.from(encodedActionLinks, 'base64').toString('utf8')) as EmailActionLink[];
	} catch {
		return [];
	}
}
