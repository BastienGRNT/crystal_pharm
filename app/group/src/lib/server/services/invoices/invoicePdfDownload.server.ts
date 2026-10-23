import { getInvoice, respondWithInvoicePdf } from '@crystal-pharm/billing-db';
import { error } from '@sveltejs/kit';
import { requireActiveGroupId } from '$lib/server/activeGroup.server';

/** Seulement une facture du groupement de la session. */
export async function downloadInvoicePdf({
	locals,
	params
}: {
	locals: App.Locals;
	params: { invoiceId: string };
}): Promise<Response> {
	const groupId = await requireActiveGroupId(locals.user);
	const invoice = await getInvoice({ groupId }, params.invoiceId);
	if (!invoice) error(404, 'Cette facture n’existe pas.');
	return respondWithInvoicePdf(invoice);
}
