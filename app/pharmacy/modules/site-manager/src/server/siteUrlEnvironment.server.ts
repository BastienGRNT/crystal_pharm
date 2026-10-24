/** Une adresse lue dans l'environnement ; l'erreur nomme la variable fautive, pour la corriger dans le `.env`. */
export function readUrlFromEnvironment(variableName: string): URL {
	const value = process.env[variableName];
	if (!value) throw new Error(`${variableName} is missing from the environment.`);
	if (!URL.canParse(value)) throw new Error(`${variableName} is not a valid URL: "${value}".`);
	return new URL(value);
}
