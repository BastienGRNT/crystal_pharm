import { issueApiToken, type ApiTokenClaims } from '@crystal-pharm/auth';
import { readRequiredEnvironmentVariable } from '@crystal-pharm/auth/toolkit';

/** Ce que le semeur du C# a créé : des compteurs seulement, jamais les données de santé elles-mêmes. */
export type DemoHealthDataSummary = { appointmentCount: number; prescriptionCount: number };

export type DemoHealthDataSeeding = { isSeeded: true; summary: DemoHealthDataSummary } | { isSeeded: false; failureMessage: string };

const demoHealthDataPathname = '/development/demo-health-data';

/**
 * Les rendez-vous et ordonnances de démo sont écrits par le C#, seul à stocker des données
 * de santé : son endpoint de dev, appelé au nom de l'Owner comme le ferait le module.
 */
export function seedDemoHealthData(caller: ApiTokenClaims, employeeIds: readonly string[]): Promise<DemoHealthDataSeeding> {
	return callDemoHealthDataEndpoint(caller, demoHealthDataPathname, { employeeIds });
}

export function receiveDemoVisitorAppointment(caller: ApiTokenClaims): Promise<DemoHealthDataSeeding> {
	return callDemoHealthDataEndpoint(caller, `${demoHealthDataPathname}/visitor-appointment`, {});
}

export function receiveDemoPrescription(caller: ApiTokenClaims): Promise<DemoHealthDataSeeding> {
	return callDemoHealthDataEndpoint(caller, `${demoHealthDataPathname}/prescription`, {});
}

// L'API peut ne pas tourner : le reste des démos doit être créé quand même, l'échec est seulement signalé.
async function callDemoHealthDataEndpoint(caller: ApiTokenClaims, pathname: string, body: object): Promise<DemoHealthDataSeeding> {
	let response: Response;
	try {
		response = await fetch(`${readRequiredEnvironmentVariable('API_URL')}${pathname}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await issueApiToken('PHARMACY_URL', caller)}` },
			body: JSON.stringify(body)
		});
	} catch {
		return { isSeeded: false, failureMessage: 'L’API C# ne répond pas : lancez `make api`, puis recommencez.' };
	}
	if (!response.ok) return { isSeeded: false, failureMessage: await readFailureTitle(response) };
	return { isSeeded: true, summary: (await response.json()) as DemoHealthDataSummary };
}

async function readFailureTitle(response: Response): Promise<string> {
	const problem: unknown = await response.json().catch(() => undefined);
	const title = typeof problem === 'object' && problem !== null && 'title' in problem ? String(problem.title) : undefined;
	return `L’API C# a refusé (${response.status}${title ? ` · ${title}` : ''}).`;
}
