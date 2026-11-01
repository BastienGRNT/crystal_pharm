import type { AuthenticationSpace } from '@crystal-pharm/ui';

export const groupAuthenticationSpace: AuthenticationSpace = {
	label: 'Espace groupement',
	headline: 'Votre réseau de pharmacies, d’un coup d’œil.',
	description: 'Les pharmacies de votre groupement et leurs indicateurs, sur un seul tableau de bord.',
	highlights: [
		{ icon: 'buildings', title: '12 pharmacies membres', detail: 'Et celles qui attendent votre invitation' },
		{ icon: 'file-text', title: 'Un article pour tout le réseau', detail: 'Publié sur chaque site d’un coup' },
		{ icon: 'receipt', title: 'Ce que vous prenez en charge', detail: 'Module par module, sans surprise' }
	]
};
