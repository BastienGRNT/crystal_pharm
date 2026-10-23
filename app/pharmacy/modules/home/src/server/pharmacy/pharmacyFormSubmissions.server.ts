import {
	pharmacyContactDetailsFieldNames,
	type PharmacyContactDetailsInput
} from '@crystal-pharm/pharmacy-db/domain';

export const weeklyOpeningScheduleFieldName = 'weeklyOpeningSchedule';

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

function readText(formData: FormData, fieldName: string): string {
	const value = formData.get(fieldName);
	return typeof value === 'string' ? value : '';
}
