// Les règles d'un compte, sans dépendance : servent au navigateur (montrer ce
// qui est attendu) comme au serveur (le vérifier), pour toute identité.
export {
	formatFullName,
	maximumPersonNameLength,
	normalizeFirstName,
	normalizeLastName
} from './toolkit/account-rules/personNames';
export {
	isPasswordStrongEnough,
	maximumPasswordLength,
	minimumPasswordLength,
	passwordRequirements,
	type PasswordRequirement
} from './toolkit/account-rules/passwordPolicy';
export { capitalizeFirstLetter, hasLowercaseLetter, tidyTypedText } from './toolkit/account-rules/typedText';
