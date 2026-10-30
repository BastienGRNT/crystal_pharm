import { completeCheckout, getCheckout, type CheckoutOutcome } from '@crystal-pharm/billing-db';
import { formatEuros } from '@crystal-pharm/billing-db/domain';
import { error, fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { requireActiveGroupId } from '$lib/server/activeGroup.server';

const checkoutOutcomeFieldName = 'outcome';

export type CheckoutPageData = {
	description: string;
	amountLabel: string;
	lines: { label: string; amountLabel: string }[];
	returnPathname: string;
};

/** La page de paiement de test du groupement (le faux prestataire). */
export async function loadCheckoutPage({
	locals,
	params
}: {
	locals: App.Locals;
	params: { checkoutId: string };
}): Promise<CheckoutPageData> {
	const groupId = await requireActiveGroupId(locals.user);
	const checkout = await getCheckout({ groupId }, params.checkoutId);
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
		const groupId = await requireActiveGroupId(locals.user);
		const outcome: CheckoutOutcome = (await request.formData()).get(checkoutOutcomeFieldName) === 'paid' ? 'paid' : 'refused';
		const completion = await completeCheckout({ groupId }, params.checkoutId, outcome);
		if (!completion.isCompleted) return fail(400, { failureMessage: completion.failureMessage });
		redirect(303, `${completion.returnPathname}?paiement=${outcome === 'paid' ? 'reussi' : 'refuse'}`);
	}
};
