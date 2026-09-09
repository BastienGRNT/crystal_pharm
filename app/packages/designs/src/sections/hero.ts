import { field, image, link, prose, seal, text, type Trusted, type TrustedImageUrl, type TrustedUrl } from '../trusted';

export type HeroContent = {
	title: string;
	tagline: string | null;
	image: TrustedImageUrl | null;
	callToAction: { label: string; url: TrustedUrl } | null;
};

function parseCallToAction(raw: unknown): { label: string; url: TrustedUrl } | null {
	const label = text(field(raw, 'label'), 40);
	const url = link(field(raw, 'url'));
	// Un bouton sans destination valide n'est pas rendu inerte : il n'est pas rendu.
	if (label === null || url === null) return null;
	return { label, url };
}

export function parseHero(raw: unknown): Trusted<HeroContent> | null {
	const title = text(field(raw, 'title'), 120);
	if (title === null) return null;
	return seal({
		title,
		tagline: prose(field(raw, 'tagline'), 300),
		image: image(field(raw, 'image')),
		callToAction: parseCallToAction(field(raw, 'callToAction'))
	});
}
