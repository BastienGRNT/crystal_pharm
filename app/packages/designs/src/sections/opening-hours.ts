import { field, list, text } from '../trusted';

export type OpeningHoursContent = {
	title: string;
	days: { label: string; hours: string }[];
	note: string | null;
};

export function parseOpeningHours(raw: unknown): OpeningHoursContent | null {
	const title = text(field(raw, 'title'), 80);
	const days = list(
		field(raw, 'days'),
		(day) => {
			const label = text(field(day, 'label'), 40);
			const hours = text(field(day, 'hours'), 60);
			if (label === null || hours === null) return null;
			return { label, hours };
		},
		14
	);
	if (title === null || days.length === 0) return null;
	return { title, days, note: text(field(raw, 'note'), 200) };
}
