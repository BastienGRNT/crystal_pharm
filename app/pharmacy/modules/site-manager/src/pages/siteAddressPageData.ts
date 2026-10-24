export type SiteAddressPageData = {
	/** `undefined` tant que le site n'a pas d'adresse. */
	currentSubdomain: string | undefined;
	/** Ce que le formulaire propose : l'adresse actuelle, ou une adresse tirée du nom de la pharmacie. */
	proposedSubdomain: string;
	/** Ce qui suit le sous-domaine : `.site.localhost:8080` en dev. */
	addressSuffix: string;
	publicSiteUrl: string | undefined;
};

export type SiteAddressFailure = { submittedSubdomain: string; errorMessage: string };

export type SiteAddressChanged = { isChanged: true };

export const subdomainFieldName = 'subdomain';
