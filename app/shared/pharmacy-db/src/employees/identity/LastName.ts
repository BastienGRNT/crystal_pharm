import * as v from 'valibot';
import { maximumPersonNameLength, normalizePersonName, type NamePart } from './personNameCasing';

const particles = new Set(['de', 'du', 'des']);
const articlesAfterDe = new Set(['la', 'le']);
const elidedParticles = new Set(['d', 'l']);

/** Les particules restent en minuscules derrière le prénom : « de la Fontaine », « Giscard d’Estaing ». */
function isParticle({ lowercaseText, previousWord, isFollowedByApostrophe, isLastPart }: NamePart): boolean {
	if (isLastPart) return false;
	if (isFollowedByApostrophe) return lowercaseText === 'd' || (elidedParticles.has(lowercaseText) && previousWord === 'de');
	return particles.has(lowercaseText) || (articlesAfterDe.has(lowercaseText) && previousWord === 'de');
}

/** Un nom de famille, toujours écrit de la même façon : « Dupont », jamais « DUPONT » ni « dupont ». */
export class LastName {
	private constructor(private readonly normalizedLastName: string) {}

	/** Lit un nom tel qu'on le tape ; `undefined` si ce n'en est pas un. */
	static parse(typedLastName: string): LastName | undefined {
		const normalizedLastName = normalizePersonName(typedLastName, isParticle);
		return normalizedLastName === undefined ? undefined : new LastName(normalizedLastName);
	}

	/** Relit un nom écrit par `toStorageFormat`. */
	static fromStorageFormat(storedLastName: string): LastName {
		const lastName = LastName.parse(storedLastName);
		if (!lastName) throw new Error(`The stored last name "${storedLastName}" is not a last name.`);
		return lastName;
	}

	toStorageFormat(): string {
		return this.normalizedLastName;
	}

	toDisplayFormat(): string {
		return this.normalizedLastName;
	}
}

export const LastNameSchema = v.pipe(
	v.string(),
	v.trim(),
	v.nonEmpty('Indiquez le nom.'),
	v.maxLength(maximumPersonNameLength, `${maximumPersonNameLength} caractères au plus.`),
	v.rawTransform(({ dataset, addIssue, NEVER }) => {
		const lastName = LastName.parse(dataset.value);
		if (lastName) return lastName;
		addIssue({ message: 'Un nom ne contient que des lettres, des espaces, des tirets et des apostrophes.' });
		return NEVER;
	})
);
