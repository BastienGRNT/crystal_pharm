import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { completeCheckout, getCheckout, type CheckoutOutcome } from '@crystal-pharm/billing-db';
import { formatEuros } from '@crystal-pharm/billing-db/domain';
import { error, fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import type { CheckoutPageData } from '../../pages/subscription/checkoutPageData';
import { requireOwner } from '../activeTenant.server';

export const checkoutOutcomeFieldName = 'outcome';

/** La page de paiement de test de la pharmacie (le faux prestataire). */
export async function loadCheckoutPage({
	locals,
	params
}: {
	locals: { user: AuthenticatedUser | null };
	params: { checkoutId: string };
}): Promise<CheckoutPageData> {
	const tenantId = (await requireOwner(locals.user)).tenantId;
	const checkout = await getCheckout({ tenantId }, params.checkoutId);
	if (!checkout) error(404, 'Ce paiement n’existe pas.');
	if (checkout.status !== 'open') redirect(303, checkout.returnPathname);
	return {
		description: checkout.description,
		amountLabel: formatEuros(checkout.amountCents),
		lines: checkout.lines.map((line) => ({ label: line.label, amountLabel: formatEuros(line.amountCents) })),
		returnPathname: checkout.returnPathname
	};
}

export const checkoutPageActions = {
	default: async ({
		locals,
		params,
		request
	}: RequestEvent<{ checkoutId: string }>): Promise<ActionFailure<{ failureMessage: string }>> => {
		const tenantId = (await requireOwner(locals.user)).tenantId;
		const outcome: CheckoutOutcome = (await request.formData()).get(checkoutOutcomeFieldName) === 'paid' ? 'paid' : 'refused';
		const completion = await completeCheckout({ tenantId }, params.checkoutId, outcome);
		if (!completion.isCompleted) return fail(400, { failureMessage: completion.failureMessage });
		redirect(303, `${completion.returnPathname}?paiement=${outcome === 'paid' ? 'reussi' : 'refuse'}`);
	}
};
