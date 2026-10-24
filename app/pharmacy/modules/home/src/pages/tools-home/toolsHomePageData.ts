import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import type { DayTimelineGap, DayTimelineHour, DayTimelineNow, DayTimelineRow, TimeListItem } from '@crystal-pharm/ui';
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
	/** « Léa », pour « Bonjour, Léa ». */
	greetingName: string;
	/** `undefined` sans planning ni rendez-vous activés. */
	today: TodayOverview | undefined;
	/** Ce qui attend la pharmacie : un rendez-vous à confirmer, une heure sans pharmacien, une fiche incomplète. */
	tasks: TimeListItem[];
};

export type TodayOverview = {
	/** « Samedi 24 octobre ». */
	dateLabel: string;
	/** « 5 personnes · 3 rendez-vous ». */
	summary: string;
	/** La frise, sur un écran large ; `undefined` quand rien n'est prévu. */
	timeline: { label: string; hours: DayTimelineHour[]; rows: DayTimelineRow[]; gaps: DayTimelineGap[]; now: DayTimelineNow | undefined } | undefined;
	/** La même journée heure par heure, sur un téléphone. */
	agendaItems: TimeListItem[];
	emptyLabel: string;
	links: { label: string; href: string }[];
	/** Le C# n'a pas répondu : les rendez-vous manquent à la journée. */
	areAppointmentsUnavailable: boolean;
};
