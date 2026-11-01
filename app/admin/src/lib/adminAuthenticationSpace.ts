import type { AuthenticationSpace } from '@crystal-pharm/ui';

export const adminAuthenticationSpace: AuthenticationSpace = {
	label: 'Administration',
	headline: 'L’administration de Crystal Pharm.',
	description: 'Abonnements, prix, groupements et quotas. Réservé à l’équipe Crystal Pharm.',
	highlights: [
		{ icon: 'receipt', title: 'Les offres et leurs versions', detail: 'Un prix publié ne change plus' },
		{ icon: 'buildings', title: 'Les groupements', detail: 'Leurs contrats et leurs quotas' }
	]
};
