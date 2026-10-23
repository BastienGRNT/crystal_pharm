import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// `import.meta.env.DEV` est remplacé au build : hors dev, l'outil n'est même pas embarqué.
export const POST: RequestHandler = async (event) => {
	if (import.meta.env.DEV) return runDevelopmentActionRequest(event);
	error(404);
};

async function runDevelopmentActionRequest({ request, locals }: RequestEvent): Promise<never> {
	const { runDevelopmentAction } = await import('@crystal-pharm/dev-tools');
	const formData = await request.formData();
	const requestedReturnPathname = String(formData.get('returnPathname') ?? '/');
	const returnPathname =
		requestedReturnPathname.startsWith('/') && !requestedReturnPathname.startsWith('//') ? requestedReturnPathname : '/';
	redirect(
		303,
		await runDevelopmentAction(String(formData.get('actionName') ?? ''), { accountId: locals.user?.userId, returnPathname })
	);
}
