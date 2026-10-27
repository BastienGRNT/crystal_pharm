import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { getInvoice, respondWithInvoicePdf } from '@crystal-pharm/billing-db';
import { error } from '@sveltejs/kit';
import { requireOwner } from '../activeTenant.server';

/** Seulement une facture de la pharmacie de la session. */
export async function downloadInvoicePdf({
	locals,
	params
}: {
	locals: { user: AuthenticatedUser | null };
	params: { invoiceId: string };
}): Promise<Response> {
	const tenantId = (await requireOwner(locals.user)).tenantId;
	const invoice = await getInvoice({ tenantId }, params.invoiceId);
	if (!invoice) error(404, 'Cette facture n’existe pas.');
	return respondWithInvoicePdf(invoice);
}
