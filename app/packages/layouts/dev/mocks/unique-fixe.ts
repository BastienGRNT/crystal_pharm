import type { ActiveModule, LayoutData, LayoutKey } from '../../src/layout';
import type { uniqueFixe } from '../../src/layouts/unique-fixe/layout';

// Ce que le site a activé, dans l'ordre qu'il veut. Volontairement
// différent de l'ordre du layout, pour voir l'effet de `orderable`.
export const uniqueFixeActive: readonly ActiveModule<LayoutKey<typeof uniqueFixe>>[] = [
	{ module: 'about', order: 1 },
	{ module: 'hero', order: 2 },
	{ module: 'pharmacyInfo', order: 3 }
];

// La donnée du site : une clé par module du layout, toutes requises.
export const uniqueFixeData: LayoutData<typeof uniqueFixe> = {
	pharmacyInfo: {
		name: 'Pharmacie Saint-Michel',
		address: '3 place Saint-Michel, 31000 Toulouse',
		phone: '05 61 00 00 00'
	},
	hero: {
		title: 'Bienvenue à la pharmacie Saint-Michel',
		subtitle: 'Ouverte 7 jours sur 7 en centre-ville.',
		imageUrl: 'https://placehold.co/240x120?text=Hero'
	},
	about: {
		title: 'Notre histoire',
		text: 'Installée en centre-ville depuis 2005, une équipe fidèle à ses patients.'
	}
};
