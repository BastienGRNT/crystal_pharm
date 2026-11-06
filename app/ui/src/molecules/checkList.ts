export type CheckListItem = {
	title: string;
	description?: string;
	/** `false` : une condition encore à remplir, atténuée. Sans valeur, l'élément est acquis. */
	isChecked?: boolean;
};
