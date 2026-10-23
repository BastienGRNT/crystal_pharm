/** Qui émet les factures : Crystal Pharm. Ses mentions légales viennent de l'environnement. */
export type InvoiceIssuer = { name: string; addressLines: string[]; legalMentions: string[] };

export function readInvoiceIssuer(): InvoiceIssuer {
	return {
		name: process.env.INVOICE_ISSUER_NAME ?? 'Crystal Pharm',
		addressLines: (process.env.INVOICE_ISSUER_ADDRESS ?? 'Adresse à compléter').split('|'),
		legalMentions: [
			`SIREN ${process.env.INVOICE_ISSUER_SIREN ?? 'à compléter'}`,
			`TVA intracommunautaire ${process.env.INVOICE_ISSUER_VAT_NUMBER ?? 'à compléter'}`
		]
	};
}
