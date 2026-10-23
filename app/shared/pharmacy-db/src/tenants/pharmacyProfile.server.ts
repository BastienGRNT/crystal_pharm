import { eq } from 'drizzle-orm';
import * as v from 'valibot';
import { PhoneNumber } from '../contact-details/PhoneNumber';
import {
	PharmacyContactDetailsSchema,
	type PharmacyContactDetails,
	type PharmacyContactDetailsFieldName,
	type PharmacyContactDetailsInput
} from '../contact-details/pharmacyContactDetails';
import { runAsTenant } from '../database/pharmacyDatabase.server';
import { tenants } from '../database/pharmacyTables';
import { collectFieldErrors, type SaveResult } from '../fieldErrors';
import {
	WeeklyOpeningScheduleSchema,
	type Weekday,
	type WeeklyOpeningSchedule
} from '../opening-hours/weeklyOpeningSchedule';

/** La fiche de la pharmacie, telle que `home` l'affiche et que le site la montre. */
export type PharmacyProfile = PharmacyContactDetails & {
	/** `undefined` tant que la pharmacie ne les a pas saisis. */
	weeklyOpeningSchedule: WeeklyOpeningSchedule | undefined;
};

export function toContactDetailsColumns(contactDetails: PharmacyContactDetails) {
	return {
		name: contactDetails.name,
		street: contactDetails.street,
		postalCode: contactDetails.postalCode,
		city: contactDetails.city,
		phoneNumber: contactDetails.phoneNumber.toStorageFormat(),
		email: contactDetails.email ?? null
	};
}

export async function getPharmacyProfile(tenantId: string): Promise<PharmacyProfile> {
	const [tenant] = await runAsTenant(tenantId, (transaction) =>
		transaction.select().from(tenants).where(eq(tenants.id, tenantId))
	);
	if (!tenant) throw new Error(`The tenant ${tenantId} does not exist.`);

	return {
		name: tenant.name,
		street: tenant.street,
		postalCode: tenant.postalCode,
		city: tenant.city,
		phoneNumber: PhoneNumber.fromStorageFormat(tenant.phoneNumber),
		email: tenant.email ?? undefined,
		weeklyOpeningSchedule: tenant.weeklyOpeningSchedule ?? undefined
	};
}

export async function updatePharmacyContactDetails(
	tenantId: string,
	contactDetailsInput: PharmacyContactDetailsInput
): Promise<SaveResult<PharmacyContactDetailsFieldName>> {
	const validation = v.safeParse(PharmacyContactDetailsSchema, contactDetailsInput);
	if (!validation.success) return { isSaved: false, fieldErrors: collectFieldErrors(validation.issues) };

	await runAsTenant(tenantId, (transaction) =>
		transaction.update(tenants).set(toContactDetailsColumns(validation.output)).where(eq(tenants.id, tenantId))
	);
	return { isSaved: true };
}

/** `weeklyOpeningScheduleInput` arrive tel quel d'un formulaire : il est vérifié ici. */
export async function updateWeeklyOpeningSchedule(
	tenantId: string,
	weeklyOpeningScheduleInput: unknown
): Promise<SaveResult<Weekday>> {
	const validation = v.safeParse(WeeklyOpeningScheduleSchema, weeklyOpeningScheduleInput);
	if (!validation.success) return { isSaved: false, fieldErrors: collectFieldErrors(validation.issues) };

	await runAsTenant(tenantId, (transaction) =>
		transaction
			.update(tenants)
			.set({ weeklyOpeningSchedule: validation.output })
			.where(eq(tenants.id, tenantId))
	);
	return { isSaved: true };
}
