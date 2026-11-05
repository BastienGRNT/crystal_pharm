import { normalizePersonName, type NamePart } from './personNameCasing';

export { maximumPersonNameLength } from './personNameCasing';

const particles = new Set(['de', 'du', 'des']);
const articlesAfterDe = new Set(['la', 'le']);
const elidedParticles = new Set(['d', 'l']);

/** Les particules restent en minuscules derrière le prénom : « de la Fontaine », « Giscard d’Estaing ». */
function isLastNameParticle({ lowercaseText, previousWord, isFollowedByApostrophe, isLastPart }: NamePart): boolean {
	if (isLastPart) return false;
	if (isFollowedByApostrophe) return lowercaseText === 'd' || (elidedParticles.has(lowercaseText) && previousWord === 'de');
	return particles.has(lowercaseText) || (articlesAfterDe.has(lowercaseText) && previousWord === 'de');
}

/** « jean-pierre » → « Jean-Pierre » ; `undefined` si ce n'est pas un prénom. */
export function normalizeFirstName(typedFirstName: string): string | undefined {
	return normalizePersonName(typedFirstName);
}

/** « DE LA FONTAINE » → « de la Fontaine », « dupont » → « Dupont » ; `undefined` si ce n'est pas un nom. */
export function normalizeLastName(typedLastName: string): string | undefined {
	return normalizePersonName(typedLastName, isLastNameParticle);
}

export function formatFullName(firstName: string, lastName: string): string {
	return `${firstName} ${lastName}`;
}
