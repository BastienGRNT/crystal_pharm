import type { AuthenticatedUser } from '@crystal-pharm/auth';
import {
	cancelSubscription,
	getToolAccessOfTenant,
	hasTenantAcceptedCurrentTerms,
	listInvoices,
	readSubscribedOffers,
	requestToolSelection,
	resumeSubscription,
	type SubscriptionCancellation
} from '@crystal-pharm/billing-db';
import { isToolKey, toInvoiceRow } from '@crystal-pharm/billing-db/domain';
import { fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { describeToolCards } from '../../domain/toolCards';
import { homePathnames, invoicePdfPathname } from '../../homePathnames';
import type { SubscriptionActionFailure, SubscriptionPageData } from '../../pages/subscription/subscriptionPageData';
import { requireOwner } from '../activeTenant.server';

export async function loadSubscriptionPage({
	locals
}: {
	locals: { user: AuthenticatedUser | null };
}): Promise<SubscriptionPageData> {
	const tenantId = (await requireOwner(locals.user)).tenantId;
	const [toolAccess, subscribedOffers, invoices, hasAcceptedCurrentTerms] = await Promise.all([
		getToolAccessOfTenant(tenantId),
		readSubscribedOffers(tenantId),
		listInvoices({ tenantId }),
		hasTenantAcceptedCurrentTerms(tenantId)
	]);
	const subscription = toolAccess.subscription;
	const refundableInvoices = invoices.filter(
		(invoice) => subscription && invoice.kind === 'invoice' && invoice.status === 'paid' && invoice.issuedAt >= subscription.startedAt
	);
	return {
		catalog: toolAccess.catalog,
		coverages: toolAccess.coveringGroup?.coverages ?? [],
		groupName: toolAccess.coveringGroup?.groupName,
		coverageEndsAt: toolAccess.coveringGroup?.coverageEndsAt,
		toolCards: describeToolCards(toolAccess),
		paidToolKeys: subscription?.endsAt
			? []
			: (subscription?.tools.filter((subscribedTool) => !subscribedTool.endsAt).map((subscribedTool) => subscribedTool.toolKey) ?? []),
		subscription: subscription && {
			startedAt: subscription.startedAt,
			billingPeriod: subscription.billingPeriod,
			nextBillingPeriod: subscription.nextBillingPeriod,
			currentPeriodStartedAt: subscription.currentPeriodStartedAt,
			currentPeriodEndsAt: subscription.currentPeriodEndsAt,
			endsAt: subscription.endsAt,
			moneyBackGuaranteeEndsAt: subscription.moneyBackGuaranteeEndsAt,
			isMoneyBackGuaranteed: subscription.isMoneyBackGuaranteed
		},
		subscribedOffers,
		upcomingCharge: toolAccess.upcomingCharge,
		refundableAmountCents: refundableInvoices.reduce((total, invoice) => total + invoice.totalCents, 0),
		invoices: invoices.map((invoice) => toInvoiceRow(invoice, invoicePdfPathname(invoice.invoiceId))),
		mustAcceptTerms: !hasAcceptedCurrentTerms
	};
}

export const subscriptionPageActions = {
	selectTools: async ({ locals, request }: RequestEvent): Promise<ActionFailure<SubscriptionActionFailure>> => {
		const tenantId = (await requireOwner(locals.user)).tenantId;
		const formData = await request.formData();
		const requestedToolKeys = formData.getAll('toolKeys').map(String).filter(isToolKey);
		const requestedBillingPeriod = formData.get('billingPeriod') === 'yearly' ? 'yearly' : 'monthly';
		const termsAcceptedBy = formData.get('termsAccepted') === 'on' ? (locals.user ?? undefined) : undefined;
		const selection = await requestToolSelection(
			tenantId,
			requestedToolKeys,
			homePathnames.subscription,
			requestedBillingPeriod,
			termsAcceptedBy
		);
		if (selection.outcome === 'refused') return fail(400, { failureMessage: selection.failureMessage });
		if (selection.outcome === 'checkout') redirect(303, selection.checkoutLocation);
		redirect(303, `${homePathnames.subscription}?modifie=1`);
	},

	cancel: async ({ locals }: RequestEvent): Promise<never> => {
		const cancellation = await cancelSubscription((await requireOwner(locals.user)).tenantId);
		redirect(303, `${homePathnames.subscription}?${new URLSearchParams(describeCancellationOutcome(cancellation))}`);
	},

	resume: async ({ locals }: RequestEvent): Promise<never> => {
		await resumeSubscription((await requireOwner(locals.user)).tenantId);
		redirect(303, `${homePathnames.subscription}?repris=1`);
	}
};

/** Les paramètres que la page lit pour annoncer la résiliation. */
function describeCancellationOutcome(cancellation: SubscriptionCancellation): Record<string, string> {
	switch (cancellation.outcome) {
		case 'refunded':
			return { resiliation: 'rembourse', montant: String(cancellation.refundedAmountCents) };
		case 'ends-at-period-end':
			return { resiliation: 'fin', jusquau: cancellation.endsAt.toISOString() };
		case 'no-subscription':
			return {};
	}
}
