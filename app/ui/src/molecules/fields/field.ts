/** Ce que Field transmet à son contrôle pour le relier au libellé, à l'aide et à l'erreur. */
export type FieldControlAttributes = {
	id: string;
	'aria-describedby'?: string;
	'aria-invalid'?: true;
};
