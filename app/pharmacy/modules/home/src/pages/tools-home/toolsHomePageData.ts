import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import type {
	ActionListItem,
	DayTimelineHour,
	DayTimelineNow,
	DayTimelineRange,
	DayTimelineRow,
	IconName,
	ModuleKey,
	StatusBadgeTone,
	TimeListItem
} from '@crystal-pharm/ui';
import type { ToolCard } from '../../domain/toolCards';
import type { ToolSetupCall } from '../../domain/toolSetupCalls';

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
	/** Ce qui reste à configurer pour que les outils servent ; vide une fois fait. */
	toolSetupCalls: ToolSetupCall[];
	coveringGroup:
		| { groupName: string; coverageEndsAt: Date | undefined; isContractActive: boolean; joinedAt: Date | undefined }
		| undefined;
	hasSubscription: boolean;
	/** Seul un titulaire choisit la formule : les autres lisent qui s'en charge. */
	canManageSubscription: boolean;
	pendingInvitations: PendingInvitationSummary[];
	/** « Léa », pour « Bonjour, Léa ». */
	greetingName: string;
	today: TodayOverview;
};

/** Ce qui se passe à l'heure où la page s'ouvre. */
export type TodayNow = {
	/** « 10:12 ». */
	timeLabel: string;
	/** Qui est au comptoir en ce moment ; `undefined` sans le planning. */
	presentPeople: { key: string; name: string; detail: string }[] | undefined;
	/** Ouvert, et aucun pharmacien en ce moment. */
	isPharmacistMissing: boolean;
	/** Le prochain rendez-vous du jour ; `undefined` sans le module, `null` quand il n'y en a plus. */
	nextAppointment: { startTime: string; reason: string; detail: string; isPending: boolean; href: string } | null | undefined;
	/** « 3 rendez-vous aujourd’hui · 3 / 5 de l’équipe dans la journée ». */
	summary: string;
};

export type TodayShortcut = { key: string; label: string; href: string; module: ModuleKey };

/** « 5 ordonnances à préparer, dont 1 en retard » : un chiffre qui ouvre la liste qu'il compte. */
export type TodayFigure = {
	key: string;
	label: string;
	value: string;
	detail: string;
	detailTone: 'neutral' | 'warning' | 'danger';
	href: string;
	icon: IconName;
	module: ModuleKey;
};

/** « De garde ce soir · de 19:00 à 09:00 le lendemain ». */
export type TodayOnDuty = {
	title: string;
	detail: string;
	/** En cours, aujourd'hui ou demain : mise en avant. */
	isSoon: boolean;
	isInProgress: boolean;
	/** La page des gardes, quand le compte y a accès. */
	href: string | undefined;
};

export type TodayOverview = {
	/** « Samedi 24 octobre ». */
	dateLabel: string;
	/** « Ouvert · ferme à 12:30 » ; `undefined` sans horaires saisis. */
	openingStatus: { label: string; tone: StatusBadgeTone } | undefined;
	now: TodayNow;
	/** La garde en cours ou la prochaine ; `undefined` sans garde déclarée. */
	onDuty: TodayOnDuty | undefined;
	figures: TodayFigure[];
	/** Ce qui demande une action, le plus urgent d'abord. */
	tasks: ActionListItem[];
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
	/** Les rendez-vous du jour, sur un téléphone ; `undefined` sans le module. */
	appointmentItems: TimeListItem[] | undefined;
	planningHref: string | undefined;
	shortcuts: TodayShortcut[];
	/** Le C# n'a pas répondu : les rendez-vous manquent à la journée. */
	areAppointmentsUnavailable: boolean;
};

/** Le retour d'une confirmation lancée depuis l'accueil. */
export type ConfirmAppointmentFailure = { confirmationFailure: string };
