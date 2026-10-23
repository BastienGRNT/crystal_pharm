import * as v from 'valibot';
import { capitalizeFirstLetter, hasLowercaseLetter, tidyTypedText } from './typedText';

export const maximumJobTitleLength = 60;

// Des lettres et chiffres, et la ponctuation d'un intitulé : « Préparateur(trice) », « Responsable PDA / stocks ».
const jobTitlePattern = /^[\p{L}\p{M}\d][\p{L}\p{M}\d \-’()/.,&+]*$/u;

/**
 * Le poste d'un Employee : une majuscule initiale, le reste tel que tapé
 * (« Responsable PDA »), sauf un intitulé tout en capitales, remis en minuscules.
 */
export class JobTitle {
	private constructor(private readonly normalizedJobTitle: string) {}

	/** Lit un poste tel qu'on le tape ; `undefined` si ce n'en est pas un. */
	static parse(typedJobTitle: string): JobTitle | undefined {
		const tidiedJobTitle = tidyTypedText(typedJobTitle);
		if (tidiedJobTitle.length > maximumJobTitleLength || !jobTitlePattern.test(tidiedJobTitle)) return undefined;
		const recasedJobTitle = hasLowercaseLetter(tidiedJobTitle) ? tidiedJobTitle : tidiedJobTitle.toLocaleLowerCase('fr');
		return new JobTitle(capitalizeFirstLetter(recasedJobTitle));
	}

	/** Relit un poste écrit par `toStorageFormat`. */
	static fromStorageFormat(storedJobTitle: string): JobTitle {
		const jobTitle = JobTitle.parse(storedJobTitle);
		if (!jobTitle) throw new Error(`The stored job title "${storedJobTitle}" is not a job title.`);
		return jobTitle;
	}

	toStorageFormat(): string {
		return this.normalizedJobTitle;
	}

	toDisplayFormat(): string {
		return this.normalizedJobTitle;
	}
}

export const JobTitleSchema = v.pipe(
	v.string(),
	v.trim(),
	v.nonEmpty('Indiquez le poste.'),
	v.maxLength(maximumJobTitleLength, `${maximumJobTitleLength} caractères au plus.`),
	v.rawTransform(({ dataset, addIssue, NEVER }) => {
		const jobTitle = JobTitle.parse(dataset.value);
		if (jobTitle) return jobTitle;
		addIssue({ message: 'Un poste commence par une lettre ou un chiffre, sans caractère spécial.' });
		return NEVER;
	})
);
