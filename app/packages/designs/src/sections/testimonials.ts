import { count, field, list, prose, text } from '../trusted';

export type TestimonialsContent = {
	title: string;
	items: { author: string; quote: string; rating: number | null }[];
};

export function parseTestimonials(raw: unknown): TestimonialsContent | null {
	const title = text(field(raw, 'title'), 80);
	const items = list(
		field(raw, 'items'),
		(item) => {
			const author = text(field(item, 'author'), 80);
			const quote = prose(field(item, 'quote'), 600);
			if (author === null || quote === null) return null;
			return { author, quote, rating: count(field(item, 'rating'), 1, 5) };
		},
		30
	);
	if (title === null || items.length === 0) return null;
	return { title, items };
}
