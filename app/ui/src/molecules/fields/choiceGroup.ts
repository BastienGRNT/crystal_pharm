import type { IconName } from '../../atoms/icons/icons';

export type ChoiceGroupOption = {
	value: string;
	label: string;
	description?: string;
	icon?: IconName;
};
