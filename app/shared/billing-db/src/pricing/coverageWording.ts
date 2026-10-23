import { describeCoverage, type ToolCoverage } from './toolPricing';

/** La prise en charge en quelques mots, la même dans les trois apps : « Offert », « −20 % »… */
export function summarizeCoverage(coverage: ToolCoverage | undefined): string | undefined {
	switch (describeCoverage(coverage)) {
		case 'full':
			return 'Offert';
		case 'shared':
			return coverage?.discountPercent
				? `−${coverage.discountPercent} %, puis ${coverage?.groupSharePercent} % payés par le groupement`
				: `${coverage?.groupSharePercent} % payés par le groupement`;
		case 'discount':
			return `−${coverage?.discountPercent} %`;
		default:
			return undefined;
	}
}
