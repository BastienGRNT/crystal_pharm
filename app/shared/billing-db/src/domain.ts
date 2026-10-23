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
export { computeCurrentPeriodEnd, computeMoneyBackGuaranteeEnd } from './subscriptions/subscriptionPeriod';
export { findTool, isToolKey, toolKeys, tools, type Tool, type ToolKey } from './tools/tools';
export type {
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
