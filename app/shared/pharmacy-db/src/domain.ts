// Ce qui sert aussi dans le navigateur (formater, vérifier une saisie) : sans base de données.
export { PhoneNumber, PhoneNumberSchema } from './contact-details/PhoneNumber';
export {
	PharmacyContactDetailsSchema,
	pharmacyContactDetailsFieldNames,
	type PharmacyContactDetails,
	type PharmacyContactDetailsFieldName,
	type PharmacyContactDetailsInput
} from './contact-details/pharmacyContactDetails';
export {
	WeeklyOpeningScheduleSchema,
	weekdays,
	type OpeningPeriod,
	type Weekday,
	type WeeklyOpeningSchedule
} from './opening-hours/weeklyOpeningSchedule';
export { collectFieldErrors, wholeFormErrorKey, type FieldErrors, type SaveResult } from './fieldErrors';
