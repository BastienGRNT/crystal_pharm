import type { InvoiceKind, InvoiceStatus } from '../database/billingTables';
import { formatEuros } from '../money/euroAmount';

/** Ce qu'il faut d'une facture pour l'afficher (les dates restent des `Date`). */
export type InvoiceToDescribe = {
	invoiceId: string;
	number: string;
	kind: InvoiceKind;
	issuedAt: Date;
	periodStart: Date | undefined;
	periodEnd: Date | undefined;
	customerName: string;
	subtotalCents: number;
	totalCents: number;
	status: InvoiceStatus;
};

export type InvoiceStatusTone = 'success' | 'warning' | 'neutral';

/** Une facture mise en mots pour un tableau ; la forme attendue par `InvoiceTable` de l'UI. */
export type InvoiceRow = {
	invoiceId: string;
	number: string;
	isCreditNote: boolean;
	issuedOnLabel: string;
	periodLabel: string | undefined;
	customerName: string;
	totalLabel: string;
	subtotalLabel: string;
	statusLabel: string;
	statusTone: InvoiceStatusTone;
	isDue: boolean;
	pdfHref: string;
};

const shortDayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const dayAndMonthFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

export function toInvoiceRow(invoice: InvoiceToDescribe, pdfHref: string): InvoiceRow {
	const status = describeInvoiceStatus(invoice);
	return {
		invoiceId: invoice.invoiceId,
		number: invoice.number,
		isCreditNote: invoice.kind === 'credit_note',
		issuedOnLabel: shortDayFormat.format(invoice.issuedAt),
		periodLabel:
			invoice.periodStart && invoice.periodEnd
				? `du ${dayAndMonthFormat.format(invoice.periodStart)} au ${shortDayFormat.format(invoice.periodEnd)}`
				: undefined,
		customerName: invoice.customerName,
		totalLabel: formatEuros(invoice.totalCents),
		subtotalLabel: formatEuros(invoice.subtotalCents),
		statusLabel: status.label,
		statusTone: status.tone,
		isDue: invoice.status === 'due',
		pdfHref
	};
}

function describeInvoiceStatus(invoice: InvoiceToDescribe): { label: string; tone: InvoiceStatusTone } {
	if (invoice.kind === 'credit_note') return { label: 'Remboursé', tone: 'neutral' };
	if (invoice.status === 'credited') return { label: 'Remboursée', tone: 'neutral' };
	if (invoice.status === 'due') return { label: 'À régler', tone: 'warning' };
	return { label: 'Payée', tone: 'success' };
}
