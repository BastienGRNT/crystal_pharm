import { field, image, link, seal, text, type Trusted, type TrustedImageUrl, type TrustedUrl } from '../trusted';

export type PharmacyInfoContent = {
	name: string;
	address: string;
	phone: TrustedUrl | null;
	logo: TrustedImageUrl | null;
};

export function parsePharmacyInfo(raw: unknown): Trusted<PharmacyInfoContent> | null {
	const name = text(field(raw, 'name'), 100);
	const address = text(field(raw, 'address'), 240);
	// Sans nom ni adresse il n'y a pas de pharmacie à afficher : la section
	// disparaît entièrement plutôt que de sortir un bloc à trous.
	if (name === null || address === null) return null;
	return seal({
		name,
		address,
		phone: link(field(raw, 'phone')),
		logo: image(field(raw, 'logo'))
	});
}
