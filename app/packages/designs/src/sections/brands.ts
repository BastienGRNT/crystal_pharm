import { field, image, link, list, seal, text, type Trusted, type TrustedImageUrl, type TrustedUrl } from '../trusted';

export type BrandsContent = {
	title: string;
	items: { name: string; logo: TrustedImageUrl | null; site: TrustedUrl | null }[];
};

export function parseBrands(raw: unknown): Trusted<BrandsContent> | null {
	const title = text(field(raw, 'title'), 80);
	const items = list(
		field(raw, 'items'),
		(item) => {
			const name = text(field(item, 'name'), 60);
			if (name === null) return null;
			return { name, logo: image(field(item, 'logo')), site: link(field(item, 'site')) };
		},
		40
	);
	if (title === null || items.length === 0) return null;
	return seal({ title, items });
}
