const minimumSecretLength = 32;
const exampleSecretMarkers = ['dev-only-', 'change-me'];

// `app/site` n'importe pas `shared/auth` : la règle de `assertProductionSecretsAreStrong` y est reprise telle quelle.
export function assertProductionSecretsAreStrong(secretVariableNames: readonly string[]): void {
  if (process.env.APP_ENV === 'development') return;

  const weakSecretNames = secretVariableNames.filter((variableName) => isWeakSecret(process.env[variableName]));
  if (weakSecretNames.length === 0) return;

  throw new Error(
    `Refusing to start in production: ${weakSecretNames.join(', ')} must be set, at least ${minimumSecretLength} characters, and not an example value.`,
  );
}

function isWeakSecret(secret: string | undefined): boolean {
  if (!secret || secret.length < minimumSecretLength) return true;
  return exampleSecretMarkers.some((marker) => secret.includes(marker));
}
