export type ActionListTone = 'danger' | 'warning' | 'neutral';

type ActionListActionBase = {
	label: string;
	/** Un seul bouton plein par ligne : l'action attendue ; les autres sont discrets. */
	isPrimary: boolean;
};

/** Un lien, ou un envoi de formulaire (POST) vers `formAction` avec `name=value`. */
export type ActionListAction =
	| (ActionListActionBase & { href: string })
	| (ActionListActionBase & { formAction: string; name: string; value: string });

export type ActionListItem = {
	id: string;
	title: string;
	detail?: string;
	tone: ActionListTone;
	actions: ActionListAction[];
};
