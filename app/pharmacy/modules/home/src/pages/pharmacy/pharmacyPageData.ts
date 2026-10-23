import type {
	EmployeeFieldName,
	EmployeeIdentityInput,
	FieldErrors,
	PharmacyContactDetailsFieldName,
	PharmacyContactDetailsInput,
	WeeklyOpeningSchedule
} from '@crystal-pharm/pharmacy-db/domain';

export type PharmacySection = 'contactDetails' | 'openingHours' | 'team' | 'group';

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

export type PharmacySectionSaved = { savedSection: PharmacySection };

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
};

export type PharmacyPageFormResult = ContactDetailsFailure | OpeningHoursFailure | EmployeeFailure | PharmacySectionSaved;

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
