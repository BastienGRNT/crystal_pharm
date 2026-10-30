import {
	employeeIdentityFieldNames,
	employeePhotoFieldName,
	pharmacyContactDetailsFieldNames,
	type EmployeeIdentityInput,
	type EmployeePhotoChange,
	type PharmacyContactDetailsInput
} from '@crystal-pharm/pharmacy-db/domain';
import { employeePhotoRemovalFieldName } from '../../pages/pharmacy/pharmacyPageData';

const weeklyOpeningScheduleFieldName = 'weeklyOpeningSchedule';
const employeeIdFieldName = 'employeeId';

export function readContactDetailsInput(formData: FormData): PharmacyContactDetailsInput {
	return Object.fromEntries(
		pharmacyContactDetailsFieldNames.map((fieldName) => [fieldName, readText(formData, fieldName)])
	) as PharmacyContactDetailsInput;
}

/** Le JSON envoyé par le formulaire des horaires, vérifié ensuite par `shared/pharmacy-db`. */
export function readWeeklyOpeningScheduleInput(formData: FormData): unknown {
	try {
		return JSON.parse(readText(formData, weeklyOpeningScheduleFieldName));
	} catch {
		return undefined;
	}
}

export function readEmployeeIdentityInput(formData: FormData): EmployeeIdentityInput {
	return Object.fromEntries(
		employeeIdentityFieldNames.map((fieldName) => [fieldName, readText(formData, fieldName)])
	) as EmployeeIdentityInput;
}

/** Un fichier choisi remplace la photo ; sans fichier, elle reste, sauf si elle a été retirée. */
export function readEmployeePhotoChange(formData: FormData): EmployeePhotoChange {
	const upload = formData.get(employeePhotoFieldName);
	if (upload instanceof Blob && upload.size > 0) return { kind: 'replaced', upload };
	return readText(formData, employeePhotoRemovalFieldName) === 'true' ? { kind: 'removed' } : { kind: 'unchanged' };
}

export function readEmployeeId(formData: FormData): string {
	return readText(formData, employeeIdFieldName);
}

export function readText(formData: FormData, fieldName: string): string {
	const value = formData.get(fieldName);
	return typeof value === 'string' ? value : '';
}
