import { getInvoiceForPlatform, respondWithInvoicePdf } from '@crystal-pharm/billing-db';
import { error } from '@sveltejs/kit';

export async function downloadInvoicePdf({ params }: { params: { invoiceId: string } }): Promise<Response> {
	const invoice = await getInvoiceForPlatform(params.invoiceId);
	if (!invoice) error(404, 'Cette facture n’existe pas.');
	return respondWithInvoicePdf(invoice);
}
