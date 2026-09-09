import type { UniqueOrdonneSiteData } from '../../src/layouts/unique-ordonne/layout.meta';

// Ordre volontairement différent de celui déclaré dans `supports`
// (pharmacyInfo, hero, about), pour vérifier que l'ordre voulu par le
// site est bien rendu (layout orderable: true).
export const mockUniqueOrdonneSiteData: UniqueOrdonneSiteData = {
	modules: [
		{ module: 'about', order: 1 },
		{ module: 'pharmacyInfo', order: 2 },
		{ module: 'hero', order: 3 }
	],
	pharmacyInfo: {
		name: 'Pharmacie de la Fontaine',
		address: '9 rue de la Fontaine, 67000 Strasbourg',
		phone: '03 88 00 00 00'
	},
	hero: {
		title: 'Votre santé, notre priorité',
		subtitle: 'Une équipe disponible 6 jours sur 7.',
		imageUrl: 'https://placehold.co/800x300?text=Hero'
	},
	about: {
		title: 'Qui sommes-nous',
		text: 'Une équipe de pharmaciens diplômés au service de votre santé depuis 1998.'
	}
};
