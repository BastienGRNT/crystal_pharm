import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// `import.meta.env.DEV` est remplacé au build : hors dev, l'outil n'est même pas embarqué.
// `group` et `admin` appellent ici : les semeurs des modules ne sont enregistrés que dans cette app.
export const POST: RequestHandler = async () => {
	if (import.meta.env.DEV) return resetDemoDataForAnotherApp();
	error(404);
};

async function resetDemoDataForAnotherApp(): Promise<Response> {
	const { resetDemoData } = await import('@crystal-pharm/dev-tools');
	return json({ notice: await resetDemoData() });
}
