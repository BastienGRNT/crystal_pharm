import {
	getGroupBillingOverview,
	listInvoices,
	platformBillingAccess,
	setGroupContractStatus,
	toInvoiceRow,
	type GroupBillingOverview,
	type InvoiceRow
} from '@crystal-pharm/billing-db';
import type { GroupContractStatus, ToolKey } from '@crystal-pharm/billing-db/domain';
import {
	getPharmacyGroupForPlatform,
	listGroupMembers,
	listMemberPharmacies,
	listPendingGroupMemberInvitations,
	listPendingPharmacyInvitations,
	platformAccess,
	revokeGroupMemberInvitation,
	type GroupMember,
	type PendingGroupMemberInvitation,
	type PendingPharmacyInvitation,
	type PharmacyGroupSummary
} from '@crystal-pharm/group-db';
import { error, fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { invoicePdfPathname } from '../invoices/invoiceListPage.server';
import { sendGroupMemberInvitation } from './groupMemberInvitationSending.server';

export type MemberPharmacyRow = {
	tenantId: string;
	name: string;
	city: string;
	joinedAt: Date;
	activeToolKeys: ToolKey[];
	groupMonthlyCostCents: number;
};

export type GroupDetailPageData = {
	group: PharmacyGroupSummary;
	billing: Pick<GroupBillingOverview, 'catalog' | 'contract' | 'charge' | 'upcomingCharge'>;
	memberPharmacies: MemberPharmacyRow[];
	pendingPharmacyInvitations: PendingPharmacyInvitation[];
	groupMembers: GroupMember[];
	pendingGroupMemberInvitations: PendingGroupMemberInvitation[];
	invoices: InvoiceRow[];
};

export type GroupDetailActionResult =
	| { succeededAction: 'inviteGroupMember'; invitedEmail: string }
	| { succeededAction: 'revokeGroupMemberInvitation' | 'changeContractStatus' };

export type GroupDetailActionFailure = { failedAction: 'inviteGroupMember'; failureMessage: string; submittedEmail: string };

export async function loadGroupDetailPage({ params }: { params: { groupId: string } }): Promise<GroupDetailPageData> {
	const group = await getPharmacyGroupForPlatform(params.groupId);
	if (!group) error(404, 'Ce groupement n’existe pas.');

	const billing = await getGroupBillingOverview(platformBillingAccess, group.groupId);
	const memberPharmacies = await listMemberPharmacies(platformAccess, group.groupId);
	return {
		group,
		billing: { catalog: billing.catalog, contract: billing.contract, charge: billing.charge, upcomingCharge: billing.upcomingCharge },
		memberPharmacies: memberPharmacies.map((memberPharmacy) => {
			const pharmacyBilling = billing.coveredPharmacies.find((covered) => covered.tenantId === memberPharmacy.tenantId);
			return {
				tenantId: memberPharmacy.tenantId,
				name: memberPharmacy.name,
				city: memberPharmacy.city,
				joinedAt: memberPharmacy.joinedAt,
				activeToolKeys: pharmacyBilling?.activeToolKeys ?? [],
				groupMonthlyCostCents: pharmacyBilling?.groupMonthlyCostCents ?? 0
			};
		}),
		pendingPharmacyInvitations: await listPendingPharmacyInvitations(platformAccess, group.groupId),
		groupMembers: await listGroupMembers({ kind: 'platform' }, group.groupId),
		pendingGroupMemberInvitations: await listPendingGroupMemberInvitations({ kind: 'platform' }, group.groupId),
		invoices: (await listInvoices({ groupId: group.groupId })).map((invoice) =>
			toInvoiceRow(invoice, invoicePdfPathname(invoice.invoiceId))
		)
	};
}

const contractStatuses: readonly GroupContractStatus[] = ['active', 'awaiting_payment', 'suspended'];

export const groupDetailPageActions = {
	inviteGroupMember: async ({
		params,
		request
	}: RequestEvent<{ groupId: string }>): Promise<GroupDetailActionResult | ActionFailure<GroupDetailActionFailure>> => {
		const submittedEmail = String((await request.formData()).get('email') ?? '').trim();
		const invitation = await sendGroupMemberInvitation(params.groupId, submittedEmail);
		if (!invitation.isSent) {
			return fail(400, { failedAction: 'inviteGroupMember', failureMessage: invitation.failureMessage, submittedEmail });
		}
		return { succeededAction: 'inviteGroupMember', invitedEmail: invitation.email };
	},

	revokeGroupMemberInvitation: async ({ params, request }: RequestEvent<{ groupId: string }>): Promise<GroupDetailActionResult> => {
		const invitationId = String((await request.formData()).get('invitationId') ?? '');
		await revokeGroupMemberInvitation({ kind: 'platform' }, params.groupId, invitationId);
		return { succeededAction: 'revokeGroupMemberInvitation' };
	},

	changeContractStatus: async ({ params, request }: RequestEvent<{ groupId: string }>): Promise<GroupDetailActionResult> => {
		const requestedStatus = String((await request.formData()).get('status') ?? '');
		const status = contractStatuses.find((candidate) => candidate === requestedStatus);
		if (status) await setGroupContractStatus(params.groupId, status);
		return { succeededAction: 'changeContractStatus' };
	}
};
