export type TimeListItemTone = 'accent' | 'neutral' | 'pending' | 'danger';

export type TimeListItem = {
	id: string;
	/** Sans heure, la ligne commence à sa pastille : une liste de choses à faire. */
	timeLabel?: string;
	title: string;
	detail?: string;
	tone: TimeListItemTone;
	href?: string;
	/** Lu par les lecteurs d'écran seulement, quand la couleur porte un état (« à confirmer »). */
	statusLabel?: string;
};
