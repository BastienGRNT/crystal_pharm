import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// `import.meta.env.DEV` est remplacé au build : hors dev, l'outil n'est même pas embarqué.
export const POST: RequestHandler = async (event) => {
	if (import.meta.env.DEV) return runDevelopmentActionRequest(event);
	error(404);
};

async function runDevelopmentActionRequest({ request, locals, cookies }: RequestEvent): Promise<never> {
	const { handleDevelopmentActionRequest } = await import('@crystal-pharm/dev-tools');
	redirect(303, await handleDevelopmentActionRequest({ space: 'pharmacy', request, accountId: locals.user?.userId, cookies }));
}
