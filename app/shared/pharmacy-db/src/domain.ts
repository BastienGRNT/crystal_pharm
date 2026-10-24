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
export {
	EmployeeIdentitySchema,
	employeeIdentityFieldNames,
	employeePhotoFieldName,
	formatEmployeeFullName,
	type EmployeeFieldName,
	type EmployeeIdentity,
	type EmployeeIdentityInput,
	type EmployeePhotoChange
} from './employees/employeeIdentity';
export { FirstName, FirstNameSchema } from './employees/identity/FirstName';
export { JobTitle, JobTitleSchema } from './employees/identity/JobTitle';
export { LastName, LastNameSchema } from './employees/identity/LastName';
export {
	acceptedEmployeePhotoTypes,
	EmployeePhoto,
	maximumEmployeePhotoMegabytes
} from './employees/photos/EmployeePhoto';
export { acceptedImageTypes, detectImageFormat, toImageContentType, type ImageFormat } from './file-storage/imageFormat';
export { collectFieldErrors, wholeFormErrorKey, type FieldErrors, type SaveResult } from './fieldErrors';
