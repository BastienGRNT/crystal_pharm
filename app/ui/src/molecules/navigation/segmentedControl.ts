import type { IconName } from '../../atoms/icons/icons';

export type SegmentedControlOption = {
	label: string;
	href: string;
	isCurrent: boolean;
	icon?: IconName;
};

export type SegmentedToggleOption<Value extends string> = {
	value: Value;
	label: string;
	icon?: IconName;
};
