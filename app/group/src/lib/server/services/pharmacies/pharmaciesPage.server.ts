import { getGroupBillingOverview, getGroupContract } from '@crystal-pharm/billing-db';
import { computeOverageUnitPrice, type ToolKey } from '@crystal-pharm/billing-db/domain';
import {
	getPharmacyGroup,
	invitePharmacies,
	listMemberPharmacies,
	listPendingPharmacyInvitations,
	removePharmacyFromGroup,
	renewPharmacyInvitation,
	revokePharmacyInvitation,
	type PendingPharmacyInvitation,
	type PharmacyGroupSummary,
	type SkippedInvitationEmail
} from '@crystal-pharm/group-db';
import { parseInvitationList } from '@crystal-pharm/group-db/domain';
import { fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { requireActiveGroupId } from '$lib/server/activeGroup.server';
import { emailPharmacyInvitation } from './pharmacyInvitationSending.server';

export type MemberPharmacyRow = {
	membershipId: string;
	tenantId: string;
	name: string;
	postalCode: string;
	city: string;
	joinedAt: Date;
	activeToolKeys: ToolKey[];
	groupMonthlyCostCents: number;
};

export type PharmaciesPageData = {
	group: PharmacyGroupSummary;
	memberPharmacies: MemberPharmacyRow[];
	pendingInvitations: PendingPharmacyInvitation[];
	/** Au forfait : ce que coûte chaque pharmacie au-delà du quota (HT par mois). À l'usage, le quota est une limite. */
	overageUnitPriceCents: number | undefined;
};

export type PharmaciesActionResult =
	| { succeededAction: 'renewInvitation'; email: string }
	| { succeededAction: 'revokeInvitation' }
	| { succeededAction: 'removePharmacy'; coverageEndsAt: Date | undefined };

export type InvitePharmaciesFailure = { failedAction: 'invitePharmacies'; failureMessage: string; submittedList: string };

type GroupRequestEvent = RequestEvent<Record<string, string>>;

export async function loadPharmaciesPage({ locals }: { locals: App.Locals }): Promise<PharmaciesPageData> {
	const groupId = await requireActiveGroupId(locals.user);
	const [group, memberPharmacies, pendingInvitations, billing] = await Promise.all([
		getPharmacyGroup(groupId),
		listMemberPharmacies({ groupId }, groupId),
		listPendingPharmacyInvitations({ groupId }, groupId),
		getGroupBillingOverview({ groupId }, groupId)
	]);
	return {
		group,
		pendingInvitations,
		overageUnitPriceCents:
			billing.contract?.billingMode === 'flat_rate'
				? computeOverageUnitPrice(billing.contract.flatRateMonthlyPriceCents ?? 0, group.pharmacyQuota)
				: undefined,
		memberPharmacies: memberPharmacies.map((memberPharmacy) => {
			const pharmacyBilling = billing.coveredPharmacies.find((covered) => covered.tenantId === memberPharmacy.tenantId);
			return {
				membershipId: memberPharmacy.membershipId,
				tenantId: memberPharmacy.tenantId,
				name: memberPharmacy.name,
				postalCode: memberPharmacy.postalCode,
				city: memberPharmacy.city,
				joinedAt: memberPharmacy.joinedAt,
				activeToolKeys: pharmacyBilling?.activeToolKeys ?? [],
				groupMonthlyCostCents: pharmacyBilling?.groupMonthlyCostCents ?? 0
			};
		})
	};
}

export const pharmaciesPageActions = {
	invitePharmacies: async ({ locals, request }: GroupRequestEvent): Promise<ActionFailure<InvitePharmaciesFailure>> => {
		const groupId = await requireActiveGroupId(locals.user);
		const submittedList = String((await request.formData()).get('invitationList') ?? '');
		const { entries, unreadableLines } = parseInvitationList(submittedList);
		if (unreadableLines.length > 0) {
			return fail(400, {
				failedAction: 'invitePharmacies',
				submittedList,
				failureMessage: `Aucun email valide sur ${unreadableLines.length === 1 ? 'la ligne' : 'les lignes'} : « ${unreadableLines.join(' », « ')} ». Corrigez-les ou retirez-les.`
			});
		}

		const contract = await getGroupContract({ groupId }, groupId);
		const sending = await invitePharmacies(groupId, entries, contract?.billingMode === 'flat_rate' ? 'overage-allowed' : 'strict');
		if (!sending.isSent) return fail(400, { failedAction: 'invitePharmacies', submittedList, failureMessage: sending.failureMessage });
		for (const sentInvitation of sending.sentInvitations) await emailPharmacyInvitation(sentInvitation);
		redirect(303, `/pharmacies?${describeSending(sending.sentInvitations.length, sending.skippedEmails)}`);
	},

	renewInvitation: async ({ locals, request }: GroupRequestEvent): Promise<PharmaciesActionResult> => {
		const groupId = await requireActiveGroupId(locals.user);
		const renewedInvitation = await renewPharmacyInvitation(groupId, readInvitationId(await request.formData()));
		if (renewedInvitation) await emailPharmacyInvitation(renewedInvitation);
		return { succeededAction: 'renewInvitation', email: renewedInvitation?.email ?? '' };
	},

	revokeInvitation: async ({ locals, request }: GroupRequestEvent): Promise<PharmaciesActionResult> => {
		const groupId = await requireActiveGroupId(locals.user);
		await revokePharmacyInvitation(groupId, readInvitationId(await request.formData()));
		return { succeededAction: 'revokeInvitation' };
	},

	removePharmacy: async ({ locals, request }: GroupRequestEvent): Promise<PharmaciesActionResult> => {
		const groupId = await requireActiveGroupId(locals.user);
		const membershipId = String((await request.formData()).get('membershipId') ?? '');
		const endedCoverage = await removePharmacyFromGroup(groupId, membershipId);
		return { succeededAction: 'removePharmacy', coverageEndsAt: endedCoverage?.coverageEndsAt };
	}
};

function readInvitationId(formData: FormData): string {
	return String(formData.get('invitationId') ?? '');
}

function describeSending(sentCount: number, skippedEmails: SkippedInvitationEmail[]): URLSearchParams {
	return new URLSearchParams({
		invitations: String(sentCount),
		...(skippedEmails.length > 0 ? { dejaInvitees: skippedEmails.map((skippedEmail) => skippedEmail.email).join(',') } : {})
	});
}
