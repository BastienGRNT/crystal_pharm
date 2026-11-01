import type { LayoutServerLoad } from './$types';

// `import.meta.env.DEV` est remplacé au build : hors dev, l'outil n'est même pas embarqué.
export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	if (!import.meta.env.DEV) return { developerToolbar: undefined };
	const { loadDeveloperToolbarData } = await import('@crystal-pharm/dev-tools');
	return {
		developerToolbar: await loadDeveloperToolbarData({
			space: 'admin',
			signedInAccountId: locals.user?.userId,
			signedInEmail: locals.user?.email,
			cookies
		})
	};
};
