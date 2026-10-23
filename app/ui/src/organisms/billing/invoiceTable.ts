import type { TagTone } from '../../atoms/tag';

/** Une facture (ou un avoir), déjà mise en mots pour le tableau. */
export type InvoiceTableRow = {
	invoiceId: string;
	number: string;
	isCreditNote: boolean;
	/** « 23 oct. 2026 » */
	issuedOnLabel: string;
	/** « du 23 oct. au 23 nov. 2026 » */
	periodLabel: string | undefined;
	customerName: string;
	/** Le montant TTC, et son détail hors taxes. */
	totalLabel: string;
	subtotalLabel: string;
	statusLabel: string;
	statusTone: TagTone;
	isDue: boolean;
	pdfHref: string;
};
