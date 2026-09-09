import type { ActiveModule, LayoutData, LayoutKey } from '../../src/layout';
import type { uniqueOrdonne } from '../../src/layouts/unique-ordonne/layout';

// Ce que le site a activé, dans l'ordre qu'il veut. Volontairement
// différent de l'ordre du layout, pour voir l'effet de `orderable`.
export const uniqueOrdonneActive: readonly ActiveModule<LayoutKey<typeof uniqueOrdonne>>[] = [
	{ module: 'about', order: 1 },
	{ module: 'pharmacyInfo', order: 2 },
	{ module: 'hero', order: 3 }
];

// La donnée du site : une clé par module du layout, toutes requises.
export const uniqueOrdonneData: LayoutData<typeof uniqueOrdonne> = {
	pharmacyInfo: {
		name: 'Pharmacie de la Fontaine',
		address: '9 rue de la Fontaine, 67000 Strasbourg',
		phone: '03 88 00 00 00'
	},
	hero: {
		title: 'Votre santé, notre priorité',
		subtitle: 'Une équipe disponible 6 jours sur 7.',
		imageUrl: 'https://placehold.co/240x120?text=Hero'
	},
	about: {
		title: 'Qui sommes-nous',
		text: 'Une équipe de pharmaciens diplômés au service de votre santé depuis 1998.'
	}
};
