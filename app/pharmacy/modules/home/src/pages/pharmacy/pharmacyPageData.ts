import type {
	FieldErrors,
	PharmacyContactDetailsFieldName,
	PharmacyContactDetailsInput,
	WeeklyOpeningSchedule
} from '@crystal-pharm/pharmacy-db/domain';

export type PharmacySection = 'contactDetails' | 'openingHours' | 'group';

export type ContactDetailsFailure = {
	failedSection: 'contactDetails';
	submittedContactDetails: PharmacyContactDetailsInput;
	fieldErrors: FieldErrors<PharmacyContactDetailsFieldName>;
};

export type OpeningHoursFailure = {
	failedSection: 'openingHours';
	failureMessage: string;
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

export type PharmacyPageData = {
	contactDetails: PharmacyContactDetailsInput;
	weeklyOpeningSchedule: WeeklyOpeningSchedule | undefined;
	group: PharmacyGroupSection | undefined;
};

export type PharmacyPageFormResult = ContactDetailsFailure | OpeningHoursFailure | PharmacySectionSaved;

export const emptyContactDetails: PharmacyContactDetailsInput = {
	name: '',
	street: '',
	postalCode: '',
	city: '',
	phoneNumber: '',
	email: ''
};
