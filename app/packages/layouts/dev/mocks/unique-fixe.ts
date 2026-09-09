import type { UniqueFixeSiteData } from '../../src/layouts/unique-fixe/layout.meta';

// L'ordre demandé par le site (`modules`) est volontairement mélangé pour
// vérifier qu'il est bien IGNORÉ : layout orderable: false, donc le rendu
// doit suivre l'ordre canonique de `supports` (pharmacyInfo, hero, about),
// quel que soit l'ordre ci-dessous.
export const mockUniqueFixeSiteData: UniqueFixeSiteData = {
	modules: [
		{ module: 'about', order: 1 },
		{ module: 'hero', order: 2 },
		{ module: 'pharmacyInfo', order: 3 }
	],
	pharmacyInfo: {
		name: 'Pharmacie Saint-Michel',
		address: '3 place Saint-Michel, 31000 Toulouse',
		phone: '05 61 00 00 00'
	},
	hero: {
		title: 'Bienvenue à la pharmacie Saint-Michel',
		subtitle: 'Ouverte 7 jours sur 7 en centre-ville.',
		imageUrl: 'https://placehold.co/800x300?text=Hero'
	},
	about: {
		title: 'Notre histoire',
		text: 'Installée en centre-ville depuis 2005, une équipe fidèle à ses patients.'
	}
};
