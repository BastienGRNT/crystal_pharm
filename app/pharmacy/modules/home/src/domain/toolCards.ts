import type { TenantToolAccess } from '@crystal-pharm/billing-db';
import { findTool, summarizeCoverage, tools, type ToolKey } from '@crystal-pharm/billing-db/domain';

/**
 * `included` : offert (groupement ou gratuit) · `subscribed` : dans l'abonnement ·
 * `ending` : retiré, actif jusqu'à `endsAt` · `available` : à activer · `unavailable` : pas encore en vente.
 */
export type ToolCardStatus = 'included' | 'subscribed' | 'ending' | 'available' | 'unavailable';

export type ToolCard = {
	toolKey: ToolKey;
	label: string;
	pitch: string;
	status: ToolCardStatus;
	/** Ce que la pharmacie paie (ou paierait) chaque mois. */
	pharmacyPriceCents: number;
	listPriceCents: number;
	/** « Offert », « −20 % »… : ce que prévoit le contrat du groupement. */
	coverageSummary: string | undefined;
	endsAt: Date | undefined;
};

/** Chaque Tool, et où en est la pharmacie avec lui. */
export function describeToolCards(toolAccess: TenantToolAccess): ToolCard[] {
	return tools.map((tool) => {
		const toolQuote = toolAccess.quote.toolQuotes.find((quote) => quote.toolKey === tool.toolKey);
		const subscribedTool = toolAccess.subscription?.tools.find((candidate) => candidate.toolKey === tool.toolKey);
		const coverage = toolAccess.coveringGroup?.coverages.find((candidate) => candidate.toolKey === tool.toolKey);
		return {
			toolKey: tool.toolKey,
			label: findTool(tool.toolKey).label,
			pitch: tool.pitch,
			status: describeStatus(toolQuote, subscribedTool, toolAccess.subscription?.endsAt),
			pharmacyPriceCents: toolQuote?.pharmacyPriceCents ?? 0,
			listPriceCents: toolQuote?.listPriceCents ?? 0,
			coverageSummary: summarizeCoverage(coverage),
			endsAt: subscribedTool?.endsAt ?? toolAccess.subscription?.endsAt
		};
	});
}

function describeStatus(
	toolQuote: TenantToolAccess['quote']['toolQuotes'][number] | undefined,
	subscribedTool: { endsAt: Date | undefined } | undefined,
	subscriptionEndsAt: Date | undefined
): ToolCardStatus {
	if (!toolQuote) return 'unavailable';
	if (toolQuote.isIncluded) return 'included';
	if (!subscribedTool) return 'available';
	return subscribedTool.endsAt || subscriptionEndsAt ? 'ending' : 'subscribed';
}
