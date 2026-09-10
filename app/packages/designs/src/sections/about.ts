import { field, prose, text } from '../trusted';

export type AboutContent = {
	title: string;
	body: string;
	signature: string | null;
};

export function parseAbout(raw: unknown): AboutContent | null {
	const title = text(field(raw, 'title'), 120);
	const body = prose(field(raw, 'body'), 2000);
	if (title === null || body === null) return null;
	return { title, body, signature: text(field(raw, 'signature'), 80) };
}
