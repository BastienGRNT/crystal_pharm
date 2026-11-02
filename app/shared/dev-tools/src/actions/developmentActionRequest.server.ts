import type { DemoSpace } from '../personas/demoPersonas';
import { runDevelopmentAction } from './developmentActions.server';
import { keepDevelopmentNotice, type DevelopmentNoticeCookies } from './developmentNotice.server';

/**
 * Le POST d'une action du panneau, commun aux trois apps : lance l'action, garde son message
 * pour la page suivante et renvoie la page où rediriger.
 */
export async function handleDevelopmentActionRequest({
	space,
	request,
	accountId,
	cookies
}: {
	space: DemoSpace;
	request: Request;
	accountId: string | undefined;
	cookies: DevelopmentNoticeCookies;
}): Promise<string> {
	const formData = await request.formData();
	const returnPathname = toSameSitePathname(String(formData.get('returnPathname') ?? '/'));
	const actionName = String(formData.get('actionName') ?? '');
	try {
		const outcome = await runDevelopmentAction(actionName, { space, accountId, returnPathname });
		keepDevelopmentNotice(cookies, { message: outcome.notice, tone: outcome.tone ?? 'success' });
		return outcome.location ?? returnPathname;
	} catch (failure) {
		console.error(`Development action ${actionName} failed`, failure);
		keepDevelopmentNotice(cookies, { message: `L’action a échoué : ${describeFailure(failure)}`, tone: 'warning' });
		return returnPathname;
	}
}

// Seule une page de l'app peut suivre : jamais une adresse absolue ni `//autre-domaine`.
function toSameSitePathname(requestedPathname: string): string {
	return requestedPathname.startsWith('/') && !requestedPathname.startsWith('//') ? requestedPathname : '/';
}

function describeFailure(failure: unknown): string {
	return failure instanceof Error ? failure.message : 'erreur inconnue.';
}
