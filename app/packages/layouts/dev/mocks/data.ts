import type { ModuleData } from '../../src/modules/registry';

// Donnée canonique complète : un site la fournit pour les modules qu'il a
// activés. Mockée ici en dur, en attendant l'API C#.
export const mockData: ModuleData = {
	pharmacyInfo: {
		name: 'Pharmacie du Centre',
		address: '5 place de la Mairie, 74000 Annecy',
		phone: '04 50 00 00 00'
	},
	brands: [
		{
			name: 'Bioderma',
			logoUrl: 'https://placehold.co/96x96?text=Bioderma',
			description: 'Dermo-cosmétique, gamme sensible.'
		},
		{
			name: 'Uriage',
			logoUrl: 'https://placehold.co/96x96?text=Uriage',
			description: 'Eau thermale, soins hydratants.'
		}
	],
	testimonials: [
		{ author: 'Claire M.', quote: 'Accueil chaleureux, conseils précis.' },
		{ author: 'Marc D.', quote: 'Toujours de bons conseils sur mes traitements.' }
	],
	team: [
		{ name: 'Claire Dupont', role: 'Pharmacienne titulaire', photoUrl: 'https://placehold.co/64x64?text=CD' },
		{ name: 'Karim Haddad', role: 'Préparateur', photoUrl: 'https://placehold.co/64x64?text=KH' }
	],
	hero: {
		title: 'Votre pharmacie de quartier',
		subtitle: 'Conseils personnalisés, du lundi au samedi.',
		imageUrl: 'https://placehold.co/240x120?text=Hero'
	},
	about: {
		title: 'Qui sommes-nous',
		text: 'Une équipe de pharmaciens diplômés au service de votre santé depuis 1998.'
	}
};
