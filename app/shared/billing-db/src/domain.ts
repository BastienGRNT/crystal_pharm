// Ce qui sert aussi dans le navigateur (l'aperçu des prix en direct, les libellés) : sans base de données.
export { formatCentsForInput, formatEuros, parseEurosToCents } from './money/euroAmount';
export {
	describeCoverage,
	listPaidToolKeys,
	quoteTools,
	type CoverageKind,
	type ToolCatalog,
	type ToolCoverage,
	type ToolPrice,
	type ToolQuote,
	type ToolsQuote,
	type ToolsQuoteRequest
} from './pricing/toolPricing';
export { toInvoiceRow, type InvoiceRow } from './invoicing/invoiceRows';
export { addVat, vatRatePercent, type AmountsWithVat } from './invoicing/vatAmounts';
export { computeGroupMonthlyCharge, computeOverageUnitPrice, type GroupCharge } from './pricing/groupCharge';
export { summarizeCoverage } from './pricing/coverageWording';
export { describeGroupBillingMode, describeOveragePrice } from './pricing/groupChargeWording';
export {
	describeGroupContractInWords,
	describeGroupContractTerms,
	type ContractToolTerms,
	type ContractVoice,
	type GroupBillingTerms,
	type GroupContractTerms,
	type GroupContractWords,
	type ToolPayer
} from './pricing/groupContractTerms';
export {
	computeAmountDueToday,
	countBilledMonths,
	monthlyEquivalentOfYearlyPrice,
	priceForPeriod,
	spreadLinesOverPeriod,
	type CurrentPeriod
} from './pricing/billingPeriodPricing';
export {
	computeCurrentPeriodEnd,
	computeMoneyBackGuaranteeEnd,
	computePeriodEnd
} from './subscriptions/subscriptionPeriod';
export {
	describeIncludedTools,
	describeInclusion,
	findIncludedToolKeys,
	findIncludingToolKeys,
	findOfferLabel,
	findTool,
	isIncludedTool,
	isToolKey,
	joinToolLabels,
	sellableToolKeys,
	toolKeys,
	tools,
	type Tool,
	type ToolKey
} from './tools/tools';
export { currentTermsVersion } from './terms/termsVersion';
export type {
	BillingPeriod,
	CheckoutLine,
	CheckoutStatus,
	GroupBillingMode,
	GroupContractStatus,
	GroupPaymentMethod,
	InvoiceKind,
	InvoiceLine,
	InvoicePaymentMethod,
	InvoiceStatus
} from './database/billingTables';
