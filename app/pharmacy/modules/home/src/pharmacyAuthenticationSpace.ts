import type { AuthenticationSpace } from '@crystal-pharm/ui';

export const pharmacyAuthenticationSpace: AuthenticationSpace = {
	label: 'Espace pharmacie',
	headline: 'Votre officine, au même endroit.',
	description: 'Le planning de l’équipe, les rendez-vous, les ordonnances reçues et le site de votre pharmacie.',
	highlights: [
		{ icon: 'prescription', title: 'Ordonnance prête', detail: 'Le patient est prévenu par email' },
		{ icon: 'calendar-check', title: 'Vaccination à 14 h 30', detail: 'Réservée depuis votre site' },
		{ icon: 'calendar-dots', title: 'Samedi : 4 au comptoir', detail: 'Le planning de la semaine est publié' }
	]
};
