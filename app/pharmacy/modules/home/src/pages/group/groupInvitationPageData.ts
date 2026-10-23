import type { CoverageKind, ToolKey } from '@crystal-pharm/billing-db/domain';
import type { InvitationStatus } from '@crystal-pharm/group-db/domain';

/** Comment l'invitation est désignée dans le formulaire : son jeton (lien de l'email) ou son identifiant. */
export type InvitationReference = { invitationToken: string } | { invitationId: string };

/** Un module, aujourd'hui et une fois membre du groupement. */
export type GroupOfferRow = {
	toolKey: ToolKey;
	label: string;
	isActiveToday: boolean;
	listPriceCents: number;
	pharmacyPriceCents: number;
	isIncludedWithGroup: boolean;
	coverageKind: CoverageKind;
	coverageSummary: string | undefined;
};

export type GroupInvitationPageData = {
	invitationReference: InvitationReference;
	groupName: string;
	invitedEmail: string;
	status: InvitationStatus;
	expiresAt: Date;
	/** Le lien a été ouvert par un compte d'un autre email que celui invité. */
	isAddressedToAnotherEmail: boolean;
	offerRows: GroupOfferRow[];
	currentMonthlyTotalCents: number;
	joinedMonthlyTotalCents: number;
	toolKeysNoLongerPaid: ToolKey[];
	isContractActive: boolean;
	/** Déjà membre d'un groupement : il faut le quitter avant. */
	currentGroupName: string | undefined;
};

export type GroupInvitationActionFailure = { failureMessage: string };

/** La page publique du lien d'invitation, avant d'être dans l'espace. */
export type PublicInvitationPageData = {
	invitationToken: string;
	groupName: string;
	invitedEmail: string;
	status: InvitationStatus;
	/** `needs-pharmacy` : connecté, mais la pharmacie n'est pas encore présentée. */
	visitorSituation: 'needs-pharmacy' | 'has-account' | 'needs-account';
};
