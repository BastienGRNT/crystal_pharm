import type {
	FieldErrors,
	PharmacyContactDetailsFieldName,
	PharmacyContactDetailsInput,
	WeeklyOpeningSchedule
} from '@crystal-pharm/pharmacy-db/domain';

export type PharmacySection = 'contactDetails' | 'openingHours';

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

export type PharmacyPageData = {
	contactDetails: PharmacyContactDetailsInput;
	weeklyOpeningSchedule: WeeklyOpeningSchedule | undefined;
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
