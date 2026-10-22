import type { IconName } from '../atoms/icons';

export type SegmentedControlOption = {
	label: string;
	href: string;
	isCurrent: boolean;
	icon?: IconName;
};
