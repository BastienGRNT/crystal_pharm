export type FilterTab = {
	label: string;
	href: string;
	isCurrent: boolean;
	count?: number;
	/** Un point rouge : quelque chose y attend, ou y est à corriger. */
	needsAttention?: boolean;
};
