export type SiteSetupFacts = {
	isSiteOnline: boolean;
	hasHeroImage: boolean;
	serviceCount: number;
	/** Les actualités affichées, les siennes ou celles du groupement. */
	shownArticleCount: number;
	hasOpeningHours: boolean;
	employeeCount: number;
};

export type SiteSetupStep = { key: string; title: string; href: string; isDone: boolean };

export type SiteSetupPathnames = { siteAddress: string; siteEdition: string };

/** Ce qui rend un site complet, dans l'ordre où un Visitor le remarque. */
export function listSiteSetupSteps(facts: SiteSetupFacts, pathnames: SiteSetupPathnames): SiteSetupStep[] {
	return [
		{ key: 'address', title: 'Mettre le site en ligne', href: pathnames.siteAddress, isDone: facts.isSiteOnline },
		{ key: 'hero', title: 'Ajouter une photo d’accueil', href: `${pathnames.siteEdition}#accueil`, isDone: facts.hasHeroImage },
		{ key: 'services', title: 'Présenter vos services', href: `${pathnames.siteEdition}#services`, isDone: facts.serviceCount > 0 },
		{ key: 'news', title: 'Publier une actualité', href: `${pathnames.siteEdition}#actualites`, isDone: facts.shownArticleCount > 0 },
		{ key: 'openingHours', title: 'Renseigner vos horaires', href: '/pharmacie?onglet=horaires', isDone: facts.hasOpeningHours },
		{ key: 'team', title: 'Présenter votre équipe', href: '/pharmacie?onglet=equipe', isDone: facts.employeeCount > 0 }
	];
}
