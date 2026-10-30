import { toInvitationAccess, type InvitationProof } from '@crystal-pharm/group-db';
import { readToolCatalog } from '../catalog/toolCatalog.server';
import { readGroupContract } from '../contracts/groupContracts.server';
import { runWithBillingAccess } from '../database/billingDatabase.server';
import { quoteTools, type ToolsQuote } from '../pricing/toolPricing';
import type { ToolKey } from '../tools/tools';
import { listContinuingToolKeys, readToolAccessOfTenant } from './tenantSubscriptions.server';

/** Ce que changerait l'arrivée dans un groupement, montré avant que la pharmacie accepte. */
export type GroupJoiningPreview = {
	/** Les prix tels qu'ils seront une fois membre, Tools actuels gardés. */
	joinedQuote: ToolsQuote;
	/** Ce que la pharmacie paie aujourd'hui chaque mois. */
	currentPharmacyMonthlyTotalCents: number;
	/** Les Tools qu'elle paie aujourd'hui et que le groupement paiera en entier. */
	toolKeysNoLongerPaid: ToolKey[];
	isContractActive: boolean;
};

export async function previewGroupJoining(
	tenantId: string | undefined,
	groupId: string,
	invitationProof: InvitationProof
): Promise<GroupJoiningPreview> {
	const access = { ...toInvitationAccess(invitationProof), tenantId };
	return runWithBillingAccess(access, async (transaction) => {
		const catalog = await readToolCatalog(transaction);
		const contract = await readGroupContract(transaction, groupId);
		const currentAccess = tenantId ? await readToolAccessOfTenant(transaction, tenantId, new Date()) : undefined;
		const subscribedToolKeys = listContinuingToolKeys(currentAccess?.subscription);
		const joinedQuote = quoteTools({
			catalog,
			coverages: contract?.status === 'active' ? contract.coverages : [],
			selectedToolKeys: subscribedToolKeys
		});
		return {
			joinedQuote,
			currentPharmacyMonthlyTotalCents: currentAccess?.quote.pharmacyMonthlyTotalCents ?? 0,
			toolKeysNoLongerPaid: subscribedToolKeys.filter(
				(toolKey) => joinedQuote.toolQuotes.find((toolQuote) => toolQuote.toolKey === toolKey)?.isIncluded
			),
			isContractActive: contract?.status === 'active'
		};
	});
}
