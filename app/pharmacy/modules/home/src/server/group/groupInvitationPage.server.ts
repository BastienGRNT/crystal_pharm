import { findCustomerAccountIdByEmail, type AuthenticatedUser } from '@crystal-pharm/auth';
import { getToolAccessOfTenant, previewGroupJoining, stopPayingForIncludedTools } from '@crystal-pharm/billing-db';
import { describeIncludedTools, findOfferLabel, type ToolQuote } from '@crystal-pharm/billing-db/domain';
import {
	acceptPharmacyInvitation,
	declinePharmacyInvitation,
	findCurrentGroupOfTenant,
	findPharmacyInvitation,
	type InvitationProof
} from '@crystal-pharm/group-db';
import { findActiveTenantIdOfAccount } from '@crystal-pharm/pharmacy-db';
import { error, fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { groupInvitationPathname, homePathnames } from '../../homePathnames';
import type {
	GroupInvitationActionFailure,
	GroupInvitationPageData,
	InvitationReference,
	PublicInvitationPageData
} from '../../pages/group/groupInvitationPageData';
import { requireOwner, requireSignedInAccountId } from '../activeTenant.server';

const invitationTokenFieldName = 'jeton';
const invitationIdFieldName = 'id';

type InvitationEvent = { locals: { user: AuthenticatedUser | null } };

/** Le lien de l'email : connecté avec une pharmacie, on va droit à l'invitation dans l'espace. */
export async function loadPublicInvitationPage({
	locals,
	params
}: InvitationEvent & { params: { invitationToken: string } }): Promise<PublicInvitationPageData> {
	const invitation = await findPharmacyInvitation({ invitationToken: params.invitationToken });
	if (!invitation) error(404, 'Cette invitation n’existe pas. Vérifiez le lien reçu par email.');

	if (locals.user && (await findActiveTenantIdOfAccount(locals.user.userId))) {
		redirect(303, groupInvitationPathname({ invitationToken: params.invitationToken }));
	}
	return {
		invitationToken: params.invitationToken,
		groupName: invitation.groupName,
		invitedEmail: invitation.email,
		status: invitation.status,
		visitorSituation: locals.user
			? 'needs-pharmacy'
			: (await findCustomerAccountIdByEmail(invitation.email))
				? 'has-account'
				: 'needs-account'
	};
}

export async function loadGroupInvitationPage({ locals, url }: InvitationEvent & { url: URL }): Promise<GroupInvitationPageData> {
	const invitationReference = readInvitationReference(url.searchParams);
	if (!invitationReference) redirect(303, homePathnames.toolsHome);
	const proof = toInvitationProof(invitationReference, locals.user);
	const invitation = await findPharmacyInvitation(proof);
	if (!invitation) error(404, 'Cette invitation n’existe pas, ou elle n’est pas adressée à votre compte.');

	const tenantId = (await requireOwner(locals.user)).tenantId;
	const [preview, toolAccess, currentGroup] = await Promise.all([
		previewGroupJoining(tenantId, invitation.groupId, proof),
		getToolAccessOfTenant(tenantId),
		findCurrentGroupOfTenant(tenantId)
	]);
	return {
		invitationReference,
		groupName: invitation.groupName,
		invitedEmail: invitation.email,
		status: invitation.status,
		expiresAt: invitation.expiresAt,
		isAddressedToAnotherEmail: invitation.email !== locals.user?.email.toLowerCase(),
		offerRows: preview.joinedQuote.toolQuotes
			.filter((toolQuote) => !toolQuote.isIncludedWithAnotherTool)
			.map((toolQuote) => ({
				toolKey: toolQuote.toolKey,
				label: findOfferLabel(toolQuote.toolKey),
				includedToolsWording: describeIncludedTools(toolQuote.toolKey),
				isActiveToday: toolAccess.accessibleToolKeys.includes(toolQuote.toolKey),
				listPriceCents: toolQuote.listPriceCents,
				pharmacyPriceCents: toolQuote.pharmacyPriceCents,
				isIncludedWithGroup: toolQuote.isIncluded,
				coverageKind: toolQuote.coverageKind,
				coverageSummary: describeOfferCoverage(toolQuote)
			})),
		currentMonthlyTotalCents: preview.currentPharmacyMonthlyTotalCents,
		joinedMonthlyTotalCents: preview.joinedQuote.pharmacyMonthlyTotalCents,
		toolKeysNoLongerPaid: preview.toolKeysNoLongerPaid,
		isContractActive: preview.isContractActive,
		currentGroupName: currentGroup?.groupName
	};
}

export const groupInvitationPageActions = {
	accept: async ({ locals, request }: RequestEvent): Promise<ActionFailure<GroupInvitationActionFailure>> => {
		const tenantId = (await requireOwner(locals.user)).tenantId;
		const proof = await readSubmittedProof(request, locals.user);
		const acceptance = await acceptPharmacyInvitation(tenantId, proof);
		if (!acceptance.isAnswered) return fail(400, { failureMessage: acceptance.failureMessage });
		await stopPayingForIncludedTools(tenantId);
		redirect(303, `${homePathnames.toolsHome}?groupement=rejoint`);
	},

	decline: async ({ locals, request }: RequestEvent): Promise<ActionFailure<GroupInvitationActionFailure>> => {
		requireSignedInAccountId(locals.user);
		const refusal = await declinePharmacyInvitation(await readSubmittedProof(request, locals.user));
		if (!refusal.isAnswered) return fail(400, { failureMessage: refusal.failureMessage });
		redirect(303, `${homePathnames.toolsHome}?invitation=refusee`);
	}
};

function readInvitationReference(fields: { get: (fieldName: string) => FormDataEntryValue | null }): InvitationReference | undefined {
	const invitationToken = fields.get(invitationTokenFieldName);
	if (typeof invitationToken === 'string' && invitationToken) return { invitationToken };
	const invitationId = fields.get(invitationIdFieldName);
	if (typeof invitationId === 'string' && invitationId) return { invitationId };
	return undefined;
}

// Par identifiant, l'invitation ne s'ouvre qu'au compte de l'email invité ;
// par jeton, le lien reçu par email suffit.
function toInvitationProof(invitationReference: InvitationReference, user: AuthenticatedUser | null): InvitationProof {
	if ('invitationToken' in invitationReference) return invitationReference;
	return { invitationId: invitationReference.invitationId, accountEmail: user?.email ?? '' };
}

async function readSubmittedProof(request: Request, user: AuthenticatedUser | null): Promise<InvitationProof> {
	const invitationReference = readInvitationReference(await request.formData());
	if (!invitationReference) error(400, 'Invitation manquante.');
	return toInvitationProof(invitationReference, user);
}

/** L'avantage en une formule : la part du prix que la pharmacie ne paie plus. */
function describeOfferCoverage(toolQuote: ToolQuote): string | undefined {
	if (toolQuote.isIncluded) return 'Offert par le groupement';
	if (toolQuote.coverageKind === 'none') return undefined;
	const savedPercent = Math.round((1 - toolQuote.pharmacyPriceCents / Math.max(toolQuote.listPriceCents, 1)) * 100);
	return `−${savedPercent} % avec le groupement`;
}
