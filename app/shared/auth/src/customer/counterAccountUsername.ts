/** Les bornes du plugin `username`, reprises par la saisie de l'identifiant. */
export const counterAccountUsernameLength = { minimum: 3, maximum: 30 } as const;

/** Les caractères qu'accepte le plugin `username` : lettres sans accent, chiffres, `.` et `_`. */
const counterAccountUsernamePattern = /^[a-z0-9_.]+$/;

export type CounterAccountUsernameValidation =
	| { isValid: true; username: string }
	| { isValid: false; failureMessage: string };

export function validateCounterAccountUsername(usernameInput: string): CounterAccountUsernameValidation {
	const username = usernameInput.trim().toLowerCase();
	const { minimum, maximum } = counterAccountUsernameLength;
	if (username.length < minimum || username.length > maximum) {
		return { isValid: false, failureMessage: `L’identifiant doit contenir entre ${minimum} et ${maximum} caractères.` };
	}
	if (!counterAccountUsernamePattern.test(username)) {
		return {
			isValid: false,
			failureMessage: 'L’identifiant ne peut contenir que des lettres sans accent, des chiffres, des points et des tirets bas.'
		};
	}
	return { isValid: true, username };
}
