/** Une condition que le mot de passe d'un compte doit remplir, montrée telle quelle à la saisie. */
export type PasswordRequirement = {
	label: string;
	isMetBy: (password: string) => boolean;
};

// Better Auth refuse au-delà (`maxPasswordLength`) : on garde la même borne.
export const maximumPasswordLength = 128;

export const minimumPasswordLength = 12;

export const passwordRequirements: readonly PasswordRequirement[] = [
	{ label: `${minimumPasswordLength} caractères minimum`, isMetBy: (password) => [...password].length >= minimumPasswordLength },
	{ label: 'Une majuscule', isMetBy: (password) => /\p{Lu}/u.test(password) },
	{ label: 'Une minuscule', isMetBy: (password) => /\p{Ll}/u.test(password) },
	{ label: 'Un chiffre', isMetBy: (password) => /\p{Nd}/u.test(password) },
	{ label: 'Un caractère spécial', isMetBy: (password) => /[^\p{L}\p{N}\s]/u.test(password) }
];

export function isPasswordStrongEnough(password: string): boolean {
	return password.length <= maximumPasswordLength && passwordRequirements.every((requirement) => requirement.isMetBy(password));
}
