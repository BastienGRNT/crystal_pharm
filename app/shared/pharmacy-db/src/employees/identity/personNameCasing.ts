import { capitalizeFirstLetter, hasLowercaseLetter, tidyTypedText } from './typedText';

export const maximumPersonNameLength = 50;

// Des mots de lettres, séparés par un espace, un tiret ou une apostrophe : « Jean-Pierre », « d’Estaing ».
const personNamePattern = /^\p{L}[\p{L}\p{M}]*(?:[ \-’]\p{L}[\p{L}\p{M}]*)*$/u;

/** Un morceau du nom, entre deux espaces, tirets ou apostrophes, et ce qui l'entoure. */
export type NamePart = {
	/** En minuscules. */
	lowercaseText: string;
	/** Le mot précédent (avant l'espace), en minuscules. */
	previousWord: string | undefined;
	isFollowedByApostrophe: boolean;
	isLastPart: boolean;
};

/**
 * Le nom remis en forme, `undefined` si ce n'en est pas un. Un morceau tapé tout
 * en minuscules ou tout en capitales prend une majuscule initiale ; un morceau
 * qui commence déjà par une majuscule suivie de minuscules (« McDonald ») est
 * gardé tel quel. `isParticle` désigne les morceaux qui restent en minuscules.
 */
export function normalizePersonName(
	typedName: string,
	isParticle: (namePart: NamePart) => boolean = () => false
): string | undefined {
	const tidiedName = tidyTypedText(typedName);
	if (tidiedName.length > maximumPersonNameLength || !personNamePattern.test(tidiedName)) return undefined;

	// Les indices pairs sont les morceaux, les impairs leurs séparateurs.
	const partsAndSeparators = tidiedName.split(/([ \-’])/);
	let previousWord: string | undefined;
	return partsAndSeparators
		.map((partOrSeparator, index) => {
			if (index % 2 === 1) return partOrSeparator;
			const followingSeparator = partsAndSeparators[index + 1];
			const namePart: NamePart = {
				lowercaseText: partOrSeparator.toLocaleLowerCase('fr'),
				previousWord,
				isFollowedByApostrophe: followingSeparator === '’',
				isLastPart: followingSeparator === undefined
			};
			if (followingSeparator === ' ') previousWord = namePart.lowercaseText;
			return recaseNamePart(partOrSeparator, namePart, isParticle);
		})
		.join('');
}

function recaseNamePart(typedPart: string, namePart: NamePart, isParticle: (namePart: NamePart) => boolean): string {
	if (isDeliberatelyCapitalized(typedPart)) return typedPart;
	return isParticle(namePart) ? namePart.lowercaseText : capitalizeFirstLetter(namePart.lowercaseText);
}

function isDeliberatelyCapitalized(typedPart: string): boolean {
	return /^\p{Lu}/u.test(typedPart) && hasLowercaseLetter(typedPart);
}
