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
	type PharmacyGroupImageChange,
	type PharmacyGroupImageChanges,
	type PharmacyGroupImageKind,
	type PharmacyGroupProfileFieldName,
	type PharmacyGroupProfileInput,
	type PharmacyGroupProfileTexts
} from './groups/profile/pharmacyGroupProfile';
export {
	acceptedPharmacyGroupImageTypes,
	maximumPharmacyGroupImageMegabytes,
	type PharmacyGroupImageFormat
} from './groups/profile/PharmacyGroupImage';
export { parseInvitationList, type InvitationListEntry, type InvitationListParsing } from './invitations/invitationList';
export { describeInvitationStatus, type InvitationStatus } from './invitations/invitationStatus';
export {
	maximumGroupArticleSummaryLength,
	maximumGroupArticleTitleLength,
	type GroupArticle,
	type GroupArticleFieldName,
	type GroupArticleInput,
	type GroupArticleTexts
} from './news/groupArticle';
export { chooseDisplayedNewsSource, type DisplayedNewsSource, type NewsSource } from './news/displayedNewsSource';
