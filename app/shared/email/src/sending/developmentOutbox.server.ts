import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Email, SentEmail } from './email';

// Hors du dépôt, partagé par les trois apps de dev (chacune son processus).
const developmentOutboxPath = join(tmpdir(), 'crystal-pharm-dev-outbox.json');
const keptEmailCount = 50;

export function storeInDevelopmentOutbox(email: Email): void {
	const sentEmails = [{ ...email, sentAt: new Date().toISOString() }, ...readDevelopmentOutbox()].slice(0, keptEmailCount);
	writeFileSync(developmentOutboxPath, JSON.stringify(sentEmails, null, '\t'));
}

/** Les derniers emails « envoyés » en dev, du plus récent au plus ancien. */
export function readDevelopmentOutbox(): SentEmail[] {
	if (!existsSync(developmentOutboxPath)) return [];
	try {
		return JSON.parse(readFileSync(developmentOutboxPath, 'utf8')) as SentEmail[];
	} catch {
		return [];
	}
}

export function clearDevelopmentOutbox(): void {
	rmSync(developmentOutboxPath, { force: true });
}
