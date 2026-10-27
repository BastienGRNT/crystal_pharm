import type { ResponsibilityKey } from '@crystal-pharm/pharmacy-db/domain';

export type DemoSpace = 'pharmacy' | 'group' | 'admin';

/** Un compte de l'équipe d'une pharmacie de démo, avec ses Responsibilities. */
export type DemoTeamRole = {
	/** La pharmacie : celle du persona qui en est Owner. */
	ownerPersonaKey: string;
	responsibilityKeys: readonly ResponsibilityKey[];
};

export type DemoPersona = {
	personaKey: string;
	space: DemoSpace;
	label: string;
	/** Le parcours que ce compte permet de tester. */
	description: string;
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
		personaKey: 'pharmacien',
		space: 'pharmacy',
		label: 'Saint-Louis · titulaire',
		description: 'Tous les droits, abonnement et accès compris. Tout est activé, avec son équipe et ses comptes.',
		email: demoEmail('pharmacien'),
		firstName: 'Léa',
		lastName: 'Garcia'
	},
	{
		personaKey: 'adjoint',
		space: 'pharmacy',
		label: 'Saint-Louis · pharmacien adjoint',
		description: 'Responsabilité « Planning de l’équipe » seulement.',
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
		email: demoEmail('invitee'),
		firstName: 'Hugo',
		lastName: 'Martin'
	},
	{
		personaKey: 'pharmaplus',
		space: 'group',
		label: 'Pharma+ · à l’usage, sur facture',
		description: 'Contrat actif : 3 pharmacies, une invitation en attente, deux actualités.',
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

export const demoCounterAccounts: readonly DemoCounterAccount[] = [
	{
		personaKey: 'comptoir',
		label: 'Saint-Louis · compte comptoir',
		description: 'Partagé, sans email : « Rendez-vous » et « Ordonnances ».',
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

export function findDemoCounterAccount(personaKey: string): DemoCounterAccount | undefined {
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
