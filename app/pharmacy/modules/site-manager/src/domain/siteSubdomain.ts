// Le nom choisi par le Manager devient le premier mot de l'adresse de son site
// (`<sous-domaine>.<domaine des sites>`) : les règles d'un nom de domaine,
// plus les noms qu'on garde pour nos propres services.

const minimumSubdomainLength = 3;
const maximumSubdomainLength = 63;
const subdomainPattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const reservedSubdomains: readonly string[] = ['www', 'apercu', 'admin', 'groupement', 'site', 'sites', 'api', 'app', 'mail', 'static', 'cdn'];
const subdomainForNameWithoutLetters = 'ma-pharmacie';

export type SubdomainReading = { isValid: true; subdomain: string } | { isValid: false; errorMessage: string };

export function readSubdomainChoice(submittedSubdomain: string): SubdomainReading {
	const subdomain = submittedSubdomain.trim().toLowerCase();
	if (subdomain.length < minimumSubdomainLength || subdomain.length > maximumSubdomainLength) {
		return { isValid: false, errorMessage: `L’adresse fait entre ${minimumSubdomainLength} et ${maximumSubdomainLength} caractères.` };
	}
	// `--` est réservé aux noms de domaine accentués (`xn--…`) : il prêterait à confusion.
	if (!subdomainPattern.test(subdomain) || subdomain.includes('--')) {
		return {
			isValid: false,
			errorMessage: 'Utilisez des lettres sans accent, des chiffres et des tirets simples, sans tiret au début ni à la fin.'
		};
	}
	if (reservedSubdomains.includes(subdomain)) return { isValid: false, errorMessage: 'Cette adresse est réservée : choisissez-en une autre.' };
	return { isValid: true, subdomain };
}

/** Une adresse tirée du nom de la pharmacie : « Pharmacie de l’Étoile » → `pharmacie-de-l-etoile`. */
export function suggestSubdomain(pharmacyName: string): string {
	const subdomain = pharmacyName
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.slice(0, maximumSubdomainLength)
		.replace(/^-+|-+$/g, '');
	return readSubdomainChoice(subdomain).isValid ? subdomain : subdomainForNameWithoutLetters;
}

/** Une autre adresse à essayer quand la proposée est prise : `pharmacie-du-port-2`, `-3`… */
export function numberSubdomain(subdomain: string, attemptNumber: number): string {
	const suffix = `-${attemptNumber}`;
	return `${subdomain.slice(0, maximumSubdomainLength - suffix.length).replace(/-+$/, '')}${suffix}`;
}
