export type DemoSpace = 'pharmacy' | 'group' | 'admin';

export type DemoPersona = {
	personaKey: string;
	space: DemoSpace;
	label: string;
	/** Le parcours que ce compte permet de tester. */
	description: string;
	email: string;
	firstName: string;
	lastName: string;
};

/** Toutes les démos finissent ainsi : une réinitialisation ne touche qu'elles. */
export const demoEmailDomain = '@demo.crystal-pharm.test';
export const demoPassword = 'demo-crystal-pharm';

export const demoEmail = (localPart: string) => `${localPart}${demoEmailDomain}`;

export const demoPersonas: readonly DemoPersona[] = [
	{
		personaKey: 'nouvelle',
		space: 'pharmacy',
		label: 'Pharmacie toute neuve',
		description: 'Compte créé, bienvenue pas encore faite.',
		email: demoEmail('nouvelle'),
		firstName: 'Nina',
		lastName: 'Nouvelle'
	},
	{
		personaKey: 'independante',
		space: 'pharmacy',
		label: 'Pharmacie Centrale · seule',
		description: 'Sans groupement ni abonnement : rien n’est activé.',
		email: demoEmail('independante'),
		firstName: 'Inès',
		lastName: 'Durand'
	},
	{
		personaKey: 'abonnee',
		space: 'pharmacy',
		label: 'Pharmacie de la Gare · abonnée',
		description: 'Abonnée seule au site, payé à l’année, dans ses 30 jours.',
		email: demoEmail('abonnee'),
		firstName: 'Antoine',
		lastName: 'Bonnet'
	},
	{
		personaKey: 'membre',
		space: 'pharmacy',
		label: 'Pharmacie du Port · Pharma+',
		description: 'Membre de Pharma+ : site offert, planning à −20 %.',
		email: demoEmail('membre'),
		firstName: 'Marie',
		lastName: 'Lefèvre'
	},
	{
		personaKey: 'invitee',
		space: 'pharmacy',
		label: 'Pharmacie des Tilleuls · invitée',
		description: 'Invitée par Pharma+, pas encore répondu.',
		email: demoEmail('invitee'),
		firstName: 'Hugo',
		lastName: 'Martin'
	},
	{
		personaKey: 'pharmaplus',
		space: 'group',
		label: 'Pharma+ · à l’usage, sur facture',
		description: 'Contrat actif : 3 pharmacies, une invitation en attente.',
		email: demoEmail('pharmaplus'),
		firstName: 'Paul',
		lastName: 'Garnier'
	},
	{
		personaKey: 'reseau',
		space: 'group',
		label: 'Réseau Santé · forfait, par carte',
		description: 'Tout offert, forfait 10 pharmacies à 150 € HT / mois, payé à l’année par carte, à activer.',
		email: demoEmail('reseau'),
		firstName: 'Sophie',
		lastName: 'Roux'
	},
	{
		personaKey: 'admin',
		space: 'admin',
		label: 'Équipe Crystal Pharm',
		description: 'L’administration : catalogue, groupements, pharmacies.',
		email: demoEmail('admin'),
		firstName: 'Alex',
		lastName: 'Admin'
	}
];

export function findDemoPersona(personaKey: string): DemoPersona | undefined {
	return demoPersonas.find((persona) => persona.personaKey === personaKey);
}

export function findDemoPersonaByEmail(email: string | undefined): DemoPersona | undefined {
	return demoPersonas.find((persona) => persona.email === email?.toLowerCase());
}
