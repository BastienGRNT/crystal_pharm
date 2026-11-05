import * as v from 'valibot';

const siretPattern = /^\d{14}$/;

const sirenLength = 9;

/**
 * Le numéro SIRET de l'officine : 14 chiffres, dont les 9 premiers sont le
 * SIREN de l'entreprise, la mention que réclame chaque facture.
 */
export class Siret {
	private constructor(private readonly digits: string) {}

	/** Lit un SIRET tel qu'on le tape (« 123 456 789 00012 ») ; `undefined` si ce n'en est pas un. */
	static parse(typedSiret: string): Siret | undefined {
		const digits = typedSiret.replace(/[\s.\-]/g, '');
		return siretPattern.test(digits) && hasValidLuhnChecksum(digits) ? new Siret(digits) : undefined;
	}

	/** Relit un SIRET écrit par `toStorageFormat`. */
	static fromStorageFormat(storedSiret: string): Siret {
		const siret = Siret.parse(storedSiret);
		if (!siret) throw new Error(`The stored SIRET "${storedSiret}" is not a SIRET.`);
		return siret;
	}

	/** 14 chiffres, sans espace : « 12345678900012 ». */
	toStorageFormat(): string {
		return this.digits;
	}

	/** Comme sur un Kbis : « 123 456 789 00012 ». */
	toDisplayFormat(): string {
		return `${formatSiren(this.toSiren())} ${this.digits.slice(sirenLength)}`;
	}

	/** Les 9 chiffres de l'entreprise : « 123456789 ». */
	toSiren(): string {
		return this.digits.slice(0, sirenLength);
	}
}

/** Par groupes de trois : « 123 456 789 ». */
export function formatSiren(siren: string): string {
	return siren.replace(/(\d{3})(?=\d)/g, '$1 ');
}

// La clé de contrôle de l'INSEE : l'algorithme de Luhn, chiffre doublé un rang sur deux en partant de la droite.
function hasValidLuhnChecksum(digits: string): boolean {
	const checksum = [...digits].reverse().reduce((sum, digit, indexFromRight) => {
		const value = Number(digit) * (indexFromRight % 2 === 1 ? 2 : 1);
		return sum + (value > 9 ? value - 9 : value);
	}, 0);
	return checksum % 10 === 0;
}

export const SiretSchema = v.pipe(
	v.string(),
	v.trim(),
	v.nonEmpty('Indiquez le SIRET de la pharmacie.'),
	v.rawTransform(({ dataset, addIssue, NEVER }) => {
		const siret = Siret.parse(dataset.value);
		if (siret) return siret;
		addIssue({ message: 'Ce SIRET n’est pas valide : il compte 14 chiffres, à recopier depuis votre Kbis ou votre avis de situation Sirene.' });
		return NEVER;
	})
);
