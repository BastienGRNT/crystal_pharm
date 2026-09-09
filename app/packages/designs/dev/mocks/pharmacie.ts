/**
 * Ce qu'un gérant a saisi correctement. Volontairement typé `unknown` : ces
 * mocks entrent par la même porte que l'API C# demain, sans traitement de
 * faveur. Les images pointent sur un service public — hors ligne, elles ne
 * s'affichent pas, ce qui n'empêche aucune section de se rendre.
 */
export const pharmacieComplete: unknown = {
	pharmacyInfo: {
		name: 'Pharmacie du Vieux Port',
		address: '12 quai des Belges, 13001 Marseille',
		phone: 'tel:+33491000000',
		logo: 'https://picsum.photos/seed/logo/160/160'
	},
	hero: {
		title: 'Votre santé, au cœur du Vieux Port',
		tagline: 'Une équipe de six pharmaciens à votre écoute sept jours sur sept.',
		image: 'https://picsum.photos/seed/hero/1600/900',
		callToAction: { label: 'Prendre rendez-vous', url: 'https://exemple.fr/rdv' }
	},
	openingHours: {
		title: 'Horaires d’ouverture',
		days: [
			{ label: 'Lundi — Vendredi', hours: '8h30 – 20h00' },
			{ label: 'Samedi', hours: '9h00 – 19h00' },
			{ label: 'Dimanche', hours: '10h00 – 13h00' }
		],
		note: 'Service de garde assuré les jours fériés.'
	},
	about: {
		title: 'Une officine familiale depuis 1954',
		body:
			'Trois générations se sont succédé derrière ce comptoir. Nous avons gardé ce qui compte : ' +
			'le temps du conseil, la connaissance des familles du quartier, et la certitude qu’un ' +
			'médicament bien expliqué vaut mieux qu’un médicament bien vendu.',
		signature: 'Claire Ferrand, pharmacienne titulaire'
	},
	services: {
		title: 'Nos services',
		items: [
			{ name: 'Vaccination', description: 'Grippe, Covid et rappels, sans rendez-vous.' },
			{ name: 'Tests rapides', description: 'Angine et Covid, résultat en 15 minutes.' },
			{ name: 'Matériel médical', description: 'Location de tire-lait et de béquilles.' },
			{ name: 'Préparations', description: 'Préparations magistrales réalisées sur place.' }
		]
	},
	brands: {
		title: 'Les marques que nous distribuons',
		items: [
			{ name: 'Avène', logo: 'https://picsum.photos/seed/avene/120/60', site: 'https://exemple.fr/avene' },
			{ name: 'La Roche-Posay', logo: 'https://picsum.photos/seed/lrp/120/60' },
			{ name: 'Weleda', logo: 'https://picsum.photos/seed/weleda/120/60', site: 'https://exemple.fr/weleda' },
			{ name: 'Bioderma', logo: 'https://picsum.photos/seed/bioderma/120/60' }
		]
	},
	team: {
		title: 'L’équipe',
		members: [
			{
				name: 'Claire Ferrand',
				role: 'Pharmacienne titulaire',
				photo: 'https://picsum.photos/seed/claire/200/200',
				note: 'Diplômée de Marseille, spécialisée en orthopédie.'
			},
			{
				name: 'Yanis Brahimi',
				role: 'Pharmacien adjoint',
				photo: 'https://picsum.photos/seed/yanis/200/200',
				note: 'Référent vaccination et entretiens pharmaceutiques.'
			},
			{
				name: 'Sophie Nguyen',
				role: 'Préparatrice',
				photo: 'https://picsum.photos/seed/sophie/200/200',
				note: 'S’occupe des préparations magistrales et de la dermo-cosmétique.'
			}
		]
	},
	testimonials: {
		title: 'Ce qu’en disent nos clients',
		items: [
			{ author: 'Martine G.', quote: 'On m’explique toujours mon traitement, jamais pressée.', rating: 5 },
			{ author: 'Karim B.', quote: 'Ouvert le dimanche matin, ça m’a sauvé plus d’une fois.', rating: 5 },
			{ author: 'Élise R.', quote: 'Le conseil dermato vaut le détour.', rating: 4 }
		]
	}
};

/** Un gérant qui n'a rempli que le strict minimum. */
export const pharmacieMinimale: unknown = {
	pharmacyInfo: {
		name: 'Pharmacie des Écoles',
		address: '3 rue Lamartine, 69003 Lyon',
		phone: 'tel:+33472000000'
	},
	openingHours: {
		title: 'Horaires',
		days: [{ label: 'Lundi — Samedi', hours: '9h00 – 19h30' }]
	}
};
