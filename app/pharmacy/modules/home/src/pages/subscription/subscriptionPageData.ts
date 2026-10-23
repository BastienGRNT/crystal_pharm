import type { UpcomingCharge } from '@crystal-pharm/billing-db';
import type { InvoiceRow, ToolCatalog, ToolCoverage, ToolKey } from '@crystal-pharm/billing-db/domain';
import type { ToolCard } from '../../domain/toolCards';

export type SubscriptionSummary = {
	startedAt: Date;
	currentPeriodEndsAt: Date;
	/** Résilié : il s'arrête à cette date. */
	endsAt: Date | undefined;
	moneyBackGuaranteeEndsAt: Date;
	isMoneyBackGuaranteed: boolean;
};

export type SubscriptionPageData = {
	catalog: ToolCatalog;
	/** Ce que prévoit le contrat du groupement (vide sans groupement) : l'aperçu des prix en dépend. */
	coverages: ToolCoverage[];
	groupName: string | undefined;
	coverageEndsAt: Date | undefined;
	toolCards: ToolCard[];
	/** Les Tools payés aujourd'hui et qui continuent : le point de départ du choix. */
	paidToolKeys: ToolKey[];
	subscription: SubscriptionSummary | undefined;
	/** Le prochain prélèvement, TVA comprise ; rien si l'abonnement s'arrête. */
	upcomingCharge: UpcomingCharge | undefined;
	/** Ce que rembourserait une résiliation dans les 30 jours (TTC). */
	refundableAmountCents: number;
	invoices: InvoiceRow[];
};

export type SubscriptionActionFailure = { failureMessage: string };
