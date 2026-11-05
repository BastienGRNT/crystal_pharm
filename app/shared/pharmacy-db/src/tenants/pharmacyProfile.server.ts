import { connectToDatabase } from '@crystal-pharm/auth/toolkit';
import { eq, sql } from 'drizzle-orm';
import * as v from 'valibot';
import { PhoneNumber } from '../contact-details/PhoneNumber';
import { Siret } from '../contact-details/Siret';
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
export type PharmacyProfile = Omit<PharmacyContactDetails, 'email' | 'siret'> & {
	/** Obligatoire à la saisie, mais absent des pharmacies inscrites avant qu'il le soit. */
	email: string | undefined;
	/** Obligatoire à la saisie ; absent des pharmacies inscrites avant qu'il le soit, et de la lecture du site. */
	siret?: Siret | undefined;
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
		email: contactDetails.email,
		siret: contactDetails.siret.toStorageFormat()
	};
}

export async function getPharmacyProfile(tenantId: string): Promise<PharmacyProfile> {
	const [tenant] = await runAsTenant(tenantId, (transaction) =>
		transaction.select().from(tenants).where(eq(tenants.id, tenantId))
	);
	if (!tenant) throw new Error(`The tenant ${tenantId} does not exist.`);

	return toPharmacyProfile(tenant);
}

type PharmacyProfileRow = Omit<PharmacyContactDetails, 'phoneNumber' | 'email' | 'siret'> & {
	phoneNumber: string;
	email: string | null;
	/** Absent de `pharmacy.read_pharmacy_profile_for_site` : le site n'en a pas besoin. */
	siret?: string | null;
	weeklyOpeningSchedule: WeeklyOpeningSchedule | null;
};

/**
 * La même fiche en une seule instruction, sans transaction explicite :
 * `pharmacy.read_pharmacy_profile_for_site` pose elle-même le contexte de la Row-Level Security.
 */
export async function getPharmacyProfileInOneStatement(tenantId: string): Promise<PharmacyProfile> {
	const [row] = await connectToDatabase().execute<{ profile: PharmacyProfileRow | null }>(
		sql`select pharmacy.read_pharmacy_profile_for_site(${tenantId}::uuid) as profile`
	);
	if (!row?.profile) throw new Error(`The tenant ${tenantId} does not exist.`);
	return toPharmacyProfile(row.profile);
}

function toPharmacyProfile(row: PharmacyProfileRow): PharmacyProfile {
	return {
		name: row.name,
		street: row.street,
		postalCode: row.postalCode,
		city: row.city,
		phoneNumber: PhoneNumber.fromStorageFormat(row.phoneNumber),
		email: row.email ?? undefined,
		siret: row.siret ? Siret.fromStorageFormat(row.siret) : undefined,
		weeklyOpeningSchedule: row.weeklyOpeningSchedule ?? undefined
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

/** Efface les horaires, comme avant leur saisie (outil de dev : rejouer l'étape des horaires). */
export async function clearWeeklyOpeningSchedule(tenantId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction.update(tenants).set({ weeklyOpeningSchedule: null }).where(eq(tenants.id, tenantId))
	);
}
