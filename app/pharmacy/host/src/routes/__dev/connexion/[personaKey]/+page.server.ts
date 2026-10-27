import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// `import.meta.env.DEV` est remplacé au build : hors dev, l'outil n'est même pas embarqué.
export const load: PageServerLoad = async ({ params }) => {
	if (import.meta.env.DEV) return loadDemoCredentials(params.personaKey);
	error(404);
};

async function loadDemoCredentials(personaKey: string) {
	const { ensureDemoData, findPharmacyDemoSignIn } = await import('@crystal-pharm/dev-tools');
	const demoSignIn = findPharmacyDemoSignIn(personaKey);
	if (!demoSignIn) error(404, 'Ce compte de démo n’existe pas dans cet espace.');
	await ensureDemoData();
	return demoSignIn;
}
