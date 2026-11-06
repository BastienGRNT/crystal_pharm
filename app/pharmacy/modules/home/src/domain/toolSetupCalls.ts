import type { ToolKey } from '@crystal-pharm/billing-db/domain';

/** Une étape qui reste à faire pour qu'un outil serve : l'accueil la propose avec un bouton. */
export type ToolSetupCall = {
	toolKey: ToolKey;
	title: string;
	description: string;
	buttonLabel: string;
	href: string;
};

export type ToolSetupSituation = {
	/** Les outils que ce compte peut ouvrir, activés par la pharmacie. */
	permittedToolKeys: readonly ToolKey[];
	canEditPharmacyProfile: boolean;
	/** Le titulaire compte : il est dans l'équipe dès la création de la pharmacie. */
	employeeCount: number;
	hasCreatedSite: boolean;
	pathnames: { newEmployee: string; siteEditor: string };
};

/** Tant qu'un outil n'est pas configuré, une carte le dit : le planning d'abord, puis le site. */
export function listToolSetupCalls(situation: ToolSetupSituation): ToolSetupCall[] {
	const calls: ToolSetupCall[] = [];
	if (needsTeamForPlanning(situation)) {
		calls.push({
			toolKey: 'planning',
			title: 'Continuer à configurer votre planning',
			description: 'Vous êtes seul dans l’équipe : ajoutez vos collègues, le planning s’organise à partir d’eux.',
			buttonLabel: 'Ajouter mon équipe',
			href: situation.pathnames.newEmployee
		});
	}
	if (situation.permittedToolKeys.includes('site') && !situation.hasCreatedSite) {
		calls.push({
			toolKey: 'site',
			title: 'Continuer à configurer votre site',
			description: 'Choisissez son apparence et ses contenus, puis mettez-le en ligne.',
			buttonLabel: 'Configurer mon site',
			href: situation.pathnames.siteEditor
		});
	}
	return calls;
}

// Ajouter un Employee passe par la fiche de la pharmacie : sans ce droit, le bouton mènerait à une page fermée.
function needsTeamForPlanning(situation: ToolSetupSituation): boolean {
	return situation.permittedToolKeys.includes('planning') && situation.canEditPharmacyProfile && situation.employeeCount <= 1;
}
