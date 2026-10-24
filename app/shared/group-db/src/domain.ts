// Ce qui sert aussi dans le navigateur (lire une liste d'emails, vérifier une saisie) : sans base de données.
export {
	PharmacyGroupDetailsSchema,
	type PharmacyGroupDetails,
	type PharmacyGroupDetailsFieldName,
	type PharmacyGroupDetailsInput
} from './groups/pharmacyGroupDetails';
export {
	maximumLoyaltyCardMessageLength,
	pharmacyGroupImageFields,
	pharmacyGroupProfileTextFieldNames,
	PharmacyGroupProfileSchema,
	type PharmacyGroupImageChange,
	type PharmacyGroupImageChanges,
	type PharmacyGroupImageKind,
	type PharmacyGroupProfileFieldName,
	type PharmacyGroupProfileInput,
	type PharmacyGroupProfileTexts
} from './groups/profile/pharmacyGroupProfile';
export { maximumPharmacyGroupImageMegabytes } from './groups/profile/PharmacyGroupImage';
export { parseInvitationList, type InvitationListEntry, type InvitationListParsing } from './invitations/invitationList';
export { describeInvitationStatus, type InvitationStatus } from './invitations/invitationStatus';
export { computeCoverageEnd } from './pharmacies/coveragePeriod';
