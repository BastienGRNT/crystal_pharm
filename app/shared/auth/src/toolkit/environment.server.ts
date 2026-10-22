export function readRequiredEnvironmentVariable(variableName: string): string {
	const value = process.env[variableName];
	if (!value) throw new Error(`${variableName} is missing from the environment.`);
	return value;
}
