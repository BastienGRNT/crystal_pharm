import * as v from 'valibot';
import { maximumPersonNameLength, normalizePersonName } from './personNameCasing';

/** Un prénom, toujours écrit de la même façon : « Jean-Pierre », jamais « JEAN-PIERRE » ni « jean-pierre ». */
export class FirstName {
	private constructor(private readonly normalizedFirstName: string) {}

	/** Lit un prénom tel qu'on le tape ; `undefined` si ce n'en est pas un. */
	static parse(typedFirstName: string): FirstName | undefined {
		const normalizedFirstName = normalizePersonName(typedFirstName);
		return normalizedFirstName === undefined ? undefined : new FirstName(normalizedFirstName);
	}

	/** Relit un prénom écrit par `toStorageFormat`. */
	static fromStorageFormat(storedFirstName: string): FirstName {
		const firstName = FirstName.parse(storedFirstName);
		if (!firstName) throw new Error(`The stored first name "${storedFirstName}" is not a first name.`);
		return firstName;
	}

	toStorageFormat(): string {
		return this.normalizedFirstName;
	}

	toDisplayFormat(): string {
		return this.normalizedFirstName;
	}
}

export const FirstNameSchema = v.pipe(
	v.string(),
	v.trim(),
	v.nonEmpty('Indiquez le prénom.'),
	v.maxLength(maximumPersonNameLength, `${maximumPersonNameLength} caractères au plus.`),
	v.rawTransform(({ dataset, addIssue, NEVER }) => {
		const firstName = FirstName.parse(dataset.value);
		if (firstName) return firstName;
		addIssue({ message: 'Un prénom ne contient que des lettres, des espaces, des tirets et des apostrophes.' });
		return NEVER;
	})
);
