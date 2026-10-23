import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// `import.meta.env.DEV` est remplacé au build : hors dev, l'outil n'est même pas embarqué.
export const load: PageServerLoad = async ({ params }) => {
	if (import.meta.env.DEV) return loadDemoCredentials(params.personaKey);
	error(404);
};

async function loadDemoCredentials(personaKey: string) {
	const { demoPassword, ensureDemoData, findDemoPersona } = await import('@crystal-pharm/dev-tools');
	const persona = findDemoPersona(personaKey);
	if (!persona || persona.space !== 'group') error(404, 'Ce compte de démo n’existe pas dans cet espace.');
	await ensureDemoData();
	return { accountLabel: persona.label, credentials: { email: persona.email, password: demoPassword } };
}
