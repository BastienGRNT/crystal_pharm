import { field, prose, seal, text, type Trusted } from '../trusted';

export type AboutContent = {
	title: string;
	body: string;
	signature: string | null;
};

export function parseAbout(raw: unknown): Trusted<AboutContent> | null {
	const title = text(field(raw, 'title'), 120);
	const body = prose(field(raw, 'body'), 2000);
	if (title === null || body === null) return null;
	return seal({ title, body, signature: text(field(raw, 'signature'), 80) });
}
