import type { ResponsibilityKey } from '@crystal-pharm/pharmacy-db/domain';

export type DemoSpace = 'pharmacy' | 'group' | 'admin';

/** Un compte de l'équipe d'une pharmacie de démo, avec ses Responsibilities. */
export type DemoTeamRole = {
	/** La pharmacie : celle du persona qui en est Owner. */
	ownerPersonaKey: string;
	responsibilityKeys: readonly ResponsibilityKey[];
	/** Nommé Owner après avoir accepté son invitation : un deuxième titulaire. */
	isAppointedOwner?: boolean;
};

export type DemoPersona = {
	personaKey: string;
	space: DemoSpace;
	label: string;
	/** Le parcours que ce compte permet de tester. */
	description: string;
	/** Ce qui distingue ce compte au premier coup d'œil, et ce que la recherche trouve. */
	badges: readonly string[];
	email: string;
	firstName: string;
	lastName: string;
	/** Un Employee de l'équipe de démo du même nom, invité par l'Owner avec ces Responsibilities. */
	teamRole?: DemoTeamRole;
};

/** Le CounterAccount d'une pharmacie de démo : il se connecte par son identifiant, sans email. */
export type DemoCounterAccount = DemoTeamRole & {
	personaKey: string;
	label: string;
	description: string;
	badges: readonly string[];
	username: string;
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
		badges: ['Bienvenue'],
		email: demoEmail('nouvelle'),
		firstName: 'Nina',
		lastName: 'Nouvelle'
	},
	{
		personaKey: 'independante',
		space: 'pharmacy',
		label: 'Pharmacie Centrale · seule',
		description: 'Sans groupement ni abonnement : rien n’est activé. Un prix négocié l’attend : le site à 19,99 € HT.',
		badges: ['Sans abonnement', 'Accord de prix'],
		email: demoEmail('independante'),
		firstName: 'Inès',
		lastName: 'Durand'
	},
	{
		personaKey: 'abonnee',
		space: 'pharmacy',
		label: 'Pharmacie de la Gare · abonnée',
		description: 'Abonnée seule au site, payé à l’année, dans ses 30 jours.',
		badges: ['Site', 'Annuel'],
		email: demoEmail('abonnee'),
		firstName: 'Antoine',
		lastName: 'Bonnet'
	},
	{
		personaKey: 'enretard',
		space: 'pharmacy',
		label: 'Pharmacie du Marché · paiement en retard',
		description: 'Abonnée au site, prélèvement refusé : les modules restent ouverts par la grâce, le bandeau s’affiche.',
		badges: ['Site', 'Retard de paiement'],
		email: demoEmail('enretard'),
		firstName: 'Renée',
		lastName: 'Marchand'
	},
	{
		personaKey: 'membre',
		space: 'pharmacy',
		label: 'Pharmacie du Port · Pharma+',
		description: 'Membre de Pharma+ : site offert, planning à −20 %.',
		badges: ['Pharma+', 'Planning'],
		email: demoEmail('membre'),
		firstName: 'Marie',
		lastName: 'Lefèvre'
	},
	{
		personaKey: 'ancienmembre',
		space: 'pharmacy',
		label: 'Pharmacie des Remparts · a quitté Pharma+',
		description: 'Partie de Pharma+ : le site reste offert jusqu’à la fin du mois, puis se ferme sans abonnement.',
		badges: ['Départ de groupement', 'Fin de prise en charge'],
		email: demoEmail('ancienmembre'),
		firstName: 'Bruno',
		lastName: 'Rousseau'
	},
	{
		personaKey: 'pharmacien',
		space: 'pharmacy',
		label: 'Saint-Louis · titulaire',
		description: 'Tous les droits. Tout est activé : site publié, planning, rendez-vous et ordonnances, une équipe, une invitation en attente.',
		badges: ['Titulaire', 'Tout activé', 'Site publié', 'RDV', 'Ordonnances'],
		email: demoEmail('pharmacien'),
		firstName: 'Léa',
		lastName: 'Garcia'
	},
	{
		personaKey: 'cotitulaire',
		space: 'pharmacy',
		label: 'Saint-Louis · cotitulaire',
		description: 'Deuxième titulaire, nommé par Léa : tous les droits, comme elle.',
		badges: ['Titulaire', 'Deux titulaires'],
		email: demoEmail('cotitulaire'),
		firstName: 'Nicolas',
		lastName: 'Weber',
		teamRole: { ownerPersonaKey: 'pharmacien', responsibilityKeys: [], isAppointedOwner: true }
	},
	{
		personaKey: 'adjoint',
		space: 'pharmacy',
		label: 'Saint-Louis · pharmacien adjoint',
		description: 'Responsabilité « Planning de l’équipe » seulement.',
		badges: ['Planning'],
		email: demoEmail('adjoint'),
		firstName: 'Thomas',
		lastName: 'Lambert',
		teamRole: { ownerPersonaKey: 'pharmacien', responsibilityKeys: ['manage-team-planning'] }
	},
	{
		personaKey: 'preparatrice',
		space: 'pharmacy',
		label: 'Saint-Louis · préparatrice',
		description: 'Responsabilités « Rendez-vous » et « Ordonnances ».',
		badges: ['RDV', 'Ordonnances'],
		email: demoEmail('preparatrice'),
		firstName: 'Camille',
		lastName: 'Fontaine',
		teamRole: { ownerPersonaKey: 'pharmacien', responsibilityKeys: ['handle-appointments', 'handle-prescriptions'] }
	},
	{
		personaKey: 'preparateur',
		space: 'pharmacy',
		label: 'Saint-Louis · préparateur',
		description: 'Responsabilités « Site » et « Fiche de la pharmacie ».',
		badges: ['Site', 'Fiche'],
		email: demoEmail('preparateur'),
		firstName: 'Julien',
		lastName: 'Mercier',
		teamRole: { ownerPersonaKey: 'pharmacien', responsibilityKeys: ['edit-site', 'edit-pharmacy-profile'] }
	},
	{
		personaKey: 'apprentie',
		space: 'pharmacy',
		label: 'Saint-Louis · apprentie',
		description: 'Membre de l’équipe sans aucune responsabilité.',
		badges: ['Aucun droit'],
		email: demoEmail('apprentie'),
		firstName: 'Emma',
		lastName: 'Chevalier',
		teamRole: { ownerPersonaKey: 'pharmacien', responsibilityKeys: [] }
	},
	{
		personaKey: 'invitee',
		space: 'pharmacy',
		label: 'Pharmacie des Tilleuls · invitée',
		description: 'Invitée par Pharma+, pas encore répondu.',
		badges: ['Invitation Pharma+'],
		email: demoEmail('invitee'),
		firstName: 'Hugo',
		lastName: 'Martin'
	},
	{
		personaKey: 'pharmaplus',
		space: 'group',
		label: 'Pharma+ · à l’usage, sur facture',
		description: 'Contrat actif : 3 pharmacies, une partie ce mois-ci, une invitation en attente, deux actualités.',
		badges: ['À l’usage', 'Facture'],
		email: demoEmail('pharmaplus'),
		firstName: 'Paul',
		lastName: 'Garnier'
	},
	{
		personaKey: 'reseau',
		space: 'group',
		label: 'Réseau Santé · forfait, par carte',
		description: 'Tout offert, forfait 10 pharmacies à 150 € HT / mois, payé à l’année par carte, à activer.',
		badges: ['Forfait', 'Carte', 'À activer'],
		email: demoEmail('reseau'),
		firstName: 'Sophie',
		lastName: 'Roux'
	},
	{
		personaKey: 'admin',
		space: 'admin',
		label: 'Équipe Crystal Pharm',
		description: 'L’administration : catalogue, groupements, pharmacies.',
		badges: ['Platform'],
		email: demoEmail('admin'),
		firstName: 'Alex',
		lastName: 'Admin'
	}
];

export const demoCounterAccounts: readonly DemoCounterAccount[] = [
	{
		personaKey: 'comptoir',
		label: 'Saint-Louis · compte comptoir',
		description: 'Partagé, sans email : « Rendez-vous » et « Ordonnances ».',
		badges: ['Comptoir', 'RDV', 'Ordonnances'],
		username: 'comptoir.saintlouis',
		ownerPersonaKey: 'pharmacien',
		responsibilityKeys: ['handle-appointments', 'handle-prescriptions']
	}
];

export function findDemoPersona(personaKey: string): DemoPersona | undefined {
	return demoPersonas.find((persona) => persona.personaKey === personaKey);
}

export function findDemoPersonaByEmail(email: string | undefined): DemoPersona | undefined {
	return demoPersonas.find((persona) => persona.email === email?.toLowerCase());
}

function findDemoCounterAccount(personaKey: string): DemoCounterAccount | undefined {
	return demoCounterAccounts.find((counterAccount) => counterAccount.personaKey === personaKey);
}

export function findDemoCounterAccountByUsername(username: string | undefined): DemoCounterAccount | undefined {
	return demoCounterAccounts.find((counterAccount) => counterAccount.username === username);
}

/** Ce que l'écran de connexion de démo de `pharmacy` envoie : l'email, ou l'identifiant du CounterAccount. */
export function findPharmacyDemoSignIn(
	personaKey: string
): { accountLabel: string; credentials: { email: string; password: string } } | undefined {
	const persona = findDemoPersona(personaKey);
	if (persona?.space === 'pharmacy') return { accountLabel: persona.label, credentials: { email: persona.email, password: demoPassword } };
	const counterAccount = findDemoCounterAccount(personaKey);
	if (counterAccount) return { accountLabel: counterAccount.label, credentials: { email: counterAccount.username, password: demoPassword } };
	return undefined;
}
