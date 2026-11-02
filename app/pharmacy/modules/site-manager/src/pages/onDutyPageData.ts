import type { OnDutyPeriodDraft } from '../domain/onDutyPeriods';

export type OnDutyPageData = {
	/** Sans site, il n'y a rien où enregistrer les gardes. */
	isSiteCreated: boolean;
	/** Les gardes à venir ou en cours, de la plus proche à la plus lointaine. */
	periods: OnDutyPeriodDraft[];
};

export type OnDutySaved = { isSaved: true };
export type OnDutyFailure = { submittedPeriods: OnDutyPeriodDraft[]; formError: string };

export const onDutyPeriodsFieldName = 'periodsJson';
export const onDutyPathname = '/site-manager/gardes';
