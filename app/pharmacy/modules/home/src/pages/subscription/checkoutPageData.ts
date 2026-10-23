export type CheckoutPageData = {
	description: string;
	amountLabel: string;
	lines: { label: string; amountLabel: string }[];
	returnPathname: string;
};
