const minimumSecretLength = 32;
const exampleSecretMarkers = ['dev-only-', 'change-me'];

/** Sans `APP_ENV=development`, on est en production : le comportement de prod est celui par défaut. */
export function isProductionEnvironment(): boolean {
	return process.env.APP_ENV !== 'development';
}

/** Un secret d'exemple ou trop court ne démarre jamais une app de production. Les valeurs ne sont jamais écrites. */
export function assertProductionSecretsAreStrong(secretVariableNames: readonly string[]): void {
	if (!isProductionEnvironment()) return;

	const weakSecretNames = secretVariableNames.filter((variableName) => isWeakSecret(process.env[variableName]));
	if (weakSecretNames.length === 0) return;

	throw new Error(
		`Refusing to start in production: ${weakSecretNames.join(', ')} must be set, at least ${minimumSecretLength} characters, and not an example value.`
	);
}

function isWeakSecret(secret: string | undefined): boolean {
	if (!secret || secret.length < minimumSecretLength) return true;
	return exampleSecretMarkers.some((marker) => secret.includes(marker));
}
