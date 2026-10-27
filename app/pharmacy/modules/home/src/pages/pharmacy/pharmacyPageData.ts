import type {
	ResponsibilityKey,
	EmployeeFieldName,
	EmployeeIdentityInput,
	FieldErrors,
	PharmacyContactDetailsFieldName,
	PharmacyContactDetailsInput,
	WeeklyOpeningSchedule
} from '@crystal-pharm/pharmacy-db/domain';

export type PharmacySection = 'contactDetails' | 'openingHours' | 'team' | 'group' | 'access';

export type ContactDetailsFailure = {
	failedSection: 'contactDetails';
	submittedContactDetails: PharmacyContactDetailsInput;
	fieldErrors: FieldErrors<PharmacyContactDetailsFieldName>;
};

export type OpeningHoursFailure = {
	failedSection: 'openingHours';
	failureMessage: string;
};

export type EmployeeFailure = {
	failedSection: 'team';
	/** `undefined` pour un ajout. */
	employeeId: string | undefined;
	submittedIdentity: EmployeeIdentityInput;
	fieldErrors: FieldErrors<EmployeeFieldName>;
};

export type PharmacySectionSaved = {
	savedSection: PharmacySection;
	/** Ce qui vient d'être fait, quand l'onglet en montre plusieurs (les comptes et accès). */
	savedMessage?: string;
};

/** Le panneau des comptes et accès ouvert par l'URL : inviter, créer le compte comptoir, ou modifier un compte. */
export type AccessPanel = { kind: 'invitation' } | { kind: 'counter-account' } | { kind: 'member'; accountId: string };

export type AccessFieldName = 'email' | 'employeeId' | 'username' | 'password';

export type AccessFailure = {
	failedSection: 'access';
	accessPanel: AccessPanel | undefined;
	failureMessage: string;
	failedFieldName: AccessFieldName | undefined;
};

/** Un compte de la pharmacie, tel que la liste des accès le montre. */
export type AccessMember = {
	accountId: string;
	name: string;
	/** L'email, ou l'identifiant du compte comptoir. */
	detail: string;
	kindLabel: string;
	isOwner: boolean;
	isCounterAccount: boolean;
	isSignedInAccount: boolean;
	responsibilityKeys: readonly ResponsibilityKey[];
	editHref: string;
};

export type AccessInvitation = { invitationId: string; employeeFullName: string; email: string; expiresAt: Date };

/** Les comptes et accès : seulement pour un Owner. */
export type AccessSection = {
	members: AccessMember[];
	pendingInvitations: AccessInvitation[];
	/** Les Employees sans compte ni invitation en attente : ceux qu'on peut inviter. */
	invitableEmployees: { employeeId: string; fullName: string }[];
	hasCounterAccount: boolean;
};

/** Le groupement de la pharmacie : membre, ou parti avec une prise en charge qui court encore. */
export type PharmacyGroupSection = {
	groupName: string;
	joinedAt: Date | undefined;
	/** Parti : la prise en charge s'arrête à cette date. */
	coverageEndsAt: Date | undefined;
	/** « Site : offert », « Rendez-vous : −20 % »… */
	coverageLines: string[];
};

/** Un membre de l'équipe, tel que la liste et son formulaire le montrent. */
export type TeamMember = {
	employeeId: string;
	identity: EmployeeIdentityInput;
	fullName: string;
	photoUrl: string | undefined;
	editHref: string;
};

/** Le panneau ouvert par l'URL : l'ajout d'un membre, ou la modification de l'un d'eux. */
export type EmployeePanel = { employeeId: string | undefined };

export type PharmacyPageData = {
	/** L'onglet ouvert, lu dans l'URL. */
	selectedSection: PharmacySection;
	contactDetails: PharmacyContactDetailsInput;
	weeklyOpeningSchedule: WeeklyOpeningSchedule | undefined;
	team: TeamMember[];
	employeePanel: EmployeePanel | undefined;
	group: PharmacyGroupSection | undefined;
	/** Quitter le groupement : réservé aux Owners. */
	canLeaveGroup: boolean;
	/** `undefined` pour qui n'est pas Owner : l'onglet n'existe pas. */
	access: AccessSection | undefined;
	accessPanel: AccessPanel | undefined;
};

export type PharmacyPageFormResult =
	| ContactDetailsFailure
	| OpeningHoursFailure
	| EmployeeFailure
	| AccessFailure
	| PharmacySectionSaved;

/** Le nom des cases à cocher des Responsibilities, une par Responsibility cochée. */
export const responsibilityFieldName = 'responsibilityKey';

export const emptyContactDetails: PharmacyContactDetailsInput = {
	name: '',
	street: '',
	postalCode: '',
	city: '',
	phoneNumber: '',
	email: ''
};

/** Envoyé à `true` quand la photo actuelle d'un membre est retirée. */
export const employeePhotoRemovalFieldName = 'removePhoto';

export const emptyEmployeeIdentity: EmployeeIdentityInput = { firstName: '', lastName: '', jobTitle: '' };
