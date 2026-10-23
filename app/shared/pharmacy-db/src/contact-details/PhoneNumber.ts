import * as v from 'valibot';

const nationalDigitsPattern = /^0[1-9]\d{8}$/;

// La métropole et les départements d'outre-mer : leur numéro national est
// toujours « 0 » suivi de ce qui vient après l'indicatif (+262 262… → 0262…).
const frenchInternationalPrefixPattern = /^(?:\+|00)(?:33|262|590|594|596)0?(\d{9})$/;

/** Un numéro de téléphone français, enregistré et affiché partout de la même façon. */
export class PhoneNumber {
	private constructor(private readonly nationalDigits: string) {}

	/** Lit un numéro tel qu'on le tape (« 01.23.45.67.89 », « +33 1 23 45 67 89 »…) ; `undefined` si ce n'en est pas un. */
	static parse(typedPhoneNumber: string): PhoneNumber | undefined {
		const nationalDigits = toNationalDigits(removeSeparators(typedPhoneNumber));
		return nationalDigitsPattern.test(nationalDigits) ? new PhoneNumber(nationalDigits) : undefined;
	}

	/** Relit un numéro écrit par `toStorageFormat`. */
	static fromStorageFormat(storedPhoneNumber: string): PhoneNumber {
		const phoneNumber = PhoneNumber.parse(storedPhoneNumber);
		if (!phoneNumber) throw new Error(`The stored phone number "${storedPhoneNumber}" is not a French phone number.`);
		return phoneNumber;
	}

	/** Dix chiffres, sans espace : « 0123456789 ». */
	toStorageFormat(): string {
		return this.nationalDigits;
	}

	/** Par paires de chiffres : « 01 23 45 67 89 ». */
	toDisplayFormat(): string {
		return this.nationalDigits.replace(/(\d{2})(?=\d)/g, '$1 ');
	}
}

function removeSeparators(typedPhoneNumber: string): string {
	return typedPhoneNumber.replace(/\(0\)/g, '').replace(/[\s.\-/()]/g, '');
}

function toNationalDigits(phoneNumberWithoutSeparators: string): string {
	const subscriberDigits = phoneNumberWithoutSeparators.match(frenchInternationalPrefixPattern)?.[1];
	return subscriberDigits ? `0${subscriberDigits}` : phoneNumberWithoutSeparators;
}

export const PhoneNumberSchema = v.pipe(
	v.string(),
	v.trim(),
	v.nonEmpty('Indiquez un numéro de téléphone.'),
	v.rawTransform(({ dataset, addIssue, NEVER }) => {
		const phoneNumber = PhoneNumber.parse(dataset.value);
		if (phoneNumber) return phoneNumber;
		addIssue({ message: 'Ce numéro n’est pas un numéro français, par exemple 01 23 45 67 89.' });
		return NEVER;
	})
);
