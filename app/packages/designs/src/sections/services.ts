import { field, list, prose, seal, text, type Trusted } from '../trusted';

export type ServicesContent = {
	title: string;
	items: { name: string; description: string | null }[];
};

export function parseServices(raw: unknown): Trusted<ServicesContent> | null {
	const title = text(field(raw, 'title'), 80);
	const items = list(
		field(raw, 'items'),
		(item) => {
			const name = text(field(item, 'name'), 80);
			if (name === null) return null;
			return { name, description: prose(field(item, 'description'), 240) };
		},
		12
	);
	if (title === null || items.length === 0) return null;
	return seal({ title, items });
}
