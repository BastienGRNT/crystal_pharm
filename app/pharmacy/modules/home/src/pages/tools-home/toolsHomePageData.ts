import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import type { ToolCard } from '../../domain/toolCards';

export type PendingInvitationSummary = {
	invitationId: string;
	groupName: string;
	/** Offerts dès l'adhésion. */
	includedToolKeys: ToolKey[];
	/** Remisés ou partagés : moins chers, à activer. */
	reducedToolKeys: ToolKey[];
};

export type ToolsHomePageData = {
	toolCards: ToolCard[];
	coveringGroup:
		| { groupName: string; coverageEndsAt: Date | undefined; isContractActive: boolean; joinedAt: Date | undefined }
		| undefined;
	hasSubscription: boolean;
	pendingInvitations: PendingInvitationSummary[];
};
