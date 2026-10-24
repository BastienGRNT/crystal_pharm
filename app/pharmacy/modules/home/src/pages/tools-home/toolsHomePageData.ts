import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import type { DayTimelineHour, DayTimelineNow, DayTimelineRange, DayTimelineRow, ModuleKey, TimeListItem } from '@crystal-pharm/ui';
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
};

export type TodayKeyFigure = {
	key: string;
	label: string;
	value: string;
	detail: string;
	/** Un lien sous le chiffre, quand il appelle une action. */
	link: { label: string; href: string } | undefined;
	module: ModuleKey;
};

export type TodayOverview = {
	/** « Samedi 24 octobre ». */
	dateLabel: string;
	/** « ouvert de 09:00 à 12:30 », « fermé aujourd’hui » ; `undefined` sans horaires saisis. */
	openingLabel: string | undefined;
	/** Les heures d'ouverture sans pharmacien, dites une seule fois, avec l'action qui les corrige. */
	coverageAlert: { text: string; correctionHref: string } | undefined;
	keyFigures: TodayKeyFigure[];
	/** La frise, sur un écran large ; `undefined` quand rien n'est prévu. */
	timeline:
		| {
				label: string;
				hours: DayTimelineHour[];
				rows: DayTimelineRow[];
				closedRanges: DayTimelineRange[];
				closedLabel: string | undefined;
				now: DayTimelineNow | undefined;
		  }
		| undefined;
	/** Les rendez-vous du jour, dans l'ordre ; `undefined` sans le module. */
	appointmentItems: TimeListItem[] | undefined;
	links: { planning: string | undefined; appointments: string | undefined };
	/** Le C# n'a pas répondu : les rendez-vous manquent à la journée. */
	areAppointmentsUnavailable: boolean;
};
