import { and, asc, eq } from 'drizzle-orm';
import * as v from 'valibot';
import { runAsTenant } from '../database/pharmacyDatabase.server';
import { employees } from '../database/pharmacyTables';
import { collectFieldErrors, wholeFormErrorKey, type FieldErrors, type SaveResult } from '../fieldErrors';
import {
	EmployeeIdentitySchema,
	employeePhotoFieldName,
	type EmployeeFieldName,
	type EmployeeIdentity,
	type EmployeeIdentityInput,
	type EmployeePhotoChange
} from './employeeIdentity';
import { FirstName } from './identity/FirstName';
import { JobTitle } from './identity/JobTitle';
import { LastName } from './identity/LastName';
import { EmployeePhoto } from './photos/EmployeePhoto';
import { discardEmployeePhoto, readStoredEmployeePhoto, storeEmployeePhoto } from './photos/employeePhotoFiles.server';

export type Employee = EmployeeIdentity & {
	employeeId: string;
	/** `undefined` sans photo. */
	photoId: string | undefined;
};

type EmployeeSubmission =
	| { isValid: true; identity: EmployeeIdentity; photo: EmployeePhoto | undefined }
	| { isValid: false; fieldErrors: FieldErrors<EmployeeFieldName> };

const missingEmployeeResult: SaveResult<EmployeeFieldName> = {
	isSaved: false,
	fieldErrors: { [wholeFormErrorKey]: 'Ce membre de l’équipe n’existe plus.' }
};

const UuidSchema = v.pipe(v.string(), v.uuid());

/** L'équipe, dans l'ordre où ses membres ont été ajoutés. */
export async function listEmployees(tenantId: string): Promise<Employee[]> {
	const employeeRows = await runAsTenant(tenantId, (transaction) =>
		transaction.select().from(employees).where(eq(employees.tenantId, tenantId)).orderBy(asc(employees.createdAt))
	);
	return employeeRows.map((employeeRow) => ({
		employeeId: employeeRow.id,
		firstName: FirstName.fromStorageFormat(employeeRow.firstName),
		lastName: LastName.fromStorageFormat(employeeRow.lastName),
		jobTitle: JobTitle.fromStorageFormat(employeeRow.jobTitle),
		photoId: employeeRow.photoId ?? undefined
	}));
}

export async function addEmployee(
	tenantId: string,
	identityInput: EmployeeIdentityInput,
	photoChange: EmployeePhotoChange
): Promise<SaveResult<EmployeeFieldName>> {
	const submission = await validateEmployeeSubmission(identityInput, photoChange);
	if (!submission.isValid) return { isSaved: false, fieldErrors: submission.fieldErrors };

	const photoId = submission.photo && (await storeEmployeePhoto(tenantId, submission.photo));
	await discardPhotoIfWorkFails(tenantId, photoId, () =>
		runAsTenant(tenantId, (transaction) =>
			transaction
				.insert(employees)
				.values({ id: crypto.randomUUID(), tenantId, ...toIdentityColumns(submission.identity), photoId })
		)
	);
	return { isSaved: true };
}

export async function updateEmployee(
	tenantId: string,
	employeeId: string,
	identityInput: EmployeeIdentityInput,
	photoChange: EmployeePhotoChange
): Promise<SaveResult<EmployeeFieldName>> {
	if (!v.is(UuidSchema, employeeId)) return missingEmployeeResult;
	const submission = await validateEmployeeSubmission(identityInput, photoChange);
	if (!submission.isValid) return { isSaved: false, fieldErrors: submission.fieldErrors };

	const newPhotoId = submission.photo && (await storeEmployeePhoto(tenantId, submission.photo));
	const update = await discardPhotoIfWorkFails(tenantId, newPhotoId, () =>
		runAsTenant(tenantId, async (transaction) => {
			const [currentEmployee] = await transaction
				.select({ photoId: employees.photoId })
				.from(employees)
				.where(and(eq(employees.tenantId, tenantId), eq(employees.id, employeeId)))
				.for('update');
			if (!currentEmployee) return { isFound: false as const };

			const photoId = choosePhotoIdAfterChange(photoChange, currentEmployee.photoId, newPhotoId);
			await transaction
				.update(employees)
				.set({ ...toIdentityColumns(submission.identity), photoId })
				.where(and(eq(employees.tenantId, tenantId), eq(employees.id, employeeId)));
			return { isFound: true as const, abandonedPhotoId: photoId === currentEmployee.photoId ? null : currentEmployee.photoId };
		})
	);

	if (!update.isFound) {
		await discardEmployeePhoto(tenantId, newPhotoId);
		return missingEmployeeResult;
	}
	await discardEmployeePhoto(tenantId, update.abandonedPhotoId);
	return { isSaved: true };
}

/** Retire l'Employee de l'équipe, et sa photo. */
export async function removeEmployee(tenantId: string, employeeId: string): Promise<void> {
	if (!v.is(UuidSchema, employeeId)) return;
	const removedEmployees = await runAsTenant(tenantId, (transaction) =>
		transaction
			.delete(employees)
			.where(and(eq(employees.tenantId, tenantId), eq(employees.id, employeeId)))
			.returning({ photoId: employees.photoId })
	);
	for (const removedEmployee of removedEmployees) await discardEmployeePhoto(tenantId, removedEmployee.photoId);
}

/** La photo d'un Employee de ce Tenant ; `undefined` si aucun ne l'a. */
export async function readEmployeePhoto(tenantId: string, photoId: string): Promise<EmployeePhoto | undefined> {
	if (!v.is(UuidSchema, photoId)) return undefined;
	const [employeeWithPhoto] = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select({ photoId: employees.photoId })
			.from(employees)
			.where(and(eq(employees.tenantId, tenantId), eq(employees.photoId, photoId)))
			.limit(1)
	);
	return employeeWithPhoto ? readStoredEmployeePhoto(tenantId, photoId) : undefined;
}

async function validateEmployeeSubmission(
	identityInput: EmployeeIdentityInput,
	photoChange: EmployeePhotoChange
): Promise<EmployeeSubmission> {
	const identityValidation = v.safeParse(EmployeeIdentitySchema, identityInput);
	const photoReading = photoChange.kind === 'replaced' ? await EmployeePhoto.fromUpload(photoChange.upload) : undefined;

	if (identityValidation.success && (photoReading === undefined || photoReading.isValid)) {
		return { isValid: true, identity: identityValidation.output, photo: photoReading?.isValid ? photoReading.photo : undefined };
	}
	return {
		isValid: false,
		fieldErrors: {
			...(identityValidation.success ? {} : collectFieldErrors<EmployeeFieldName>(identityValidation.issues)),
			...(photoReading?.isValid === false ? { [employeePhotoFieldName]: photoReading.errorMessage } : {})
		}
	};
}

function toIdentityColumns(identity: EmployeeIdentity) {
	return {
		firstName: identity.firstName.toStorageFormat(),
		lastName: identity.lastName.toStorageFormat(),
		jobTitle: identity.jobTitle.toStorageFormat()
	};
}

function choosePhotoIdAfterChange(
	photoChange: EmployeePhotoChange,
	currentPhotoId: string | null,
	newPhotoId: string | undefined
): string | null {
	if (photoChange.kind === 'replaced') return newPhotoId ?? null;
	if (photoChange.kind === 'removed') return null;
	return currentPhotoId;
}

// Le fichier est rangé avant l'écriture en base, qui peut échouer : il ne doit pas rester orphelin.
async function discardPhotoIfWorkFails<Result>(
	tenantId: string,
	photoId: string | undefined,
	work: () => Promise<Result>
): Promise<Result> {
	try {
		return await work();
	} catch (error) {
		await discardEmployeePhoto(tenantId, photoId);
		throw error;
	}
}
