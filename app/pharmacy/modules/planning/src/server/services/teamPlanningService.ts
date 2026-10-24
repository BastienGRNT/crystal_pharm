import { getPharmacyProfile, listEmployees, type Employee as PharmacyEmployee } from '@crystal-pharm/pharmacy-db';
import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import * as v from 'valibot';
import { listOpeningPeriodsOfDate, type OpeningHours } from '../../domain/coverage';
import {
	findOverlappingShift,
	formatShiftHours,
	isPharmacistJobTitle,
	type Employee,
	type WeekPlanning
} from '../../domain/planning';
import { deleteShift, insertShift, listAbsences, listShifts, type NewShift } from '../repositories/planningRepository';

export type ShiftSubmission = Record<keyof NewShift, string>;

export type ShiftSaveResult = { isSaved: true } | { isSaved: false; message: string };

const IsoDateSchema = v.pipe(v.string(), v.isoDate('Choisissez un jour.'));
const TimeOfDaySchema = v.pipe(v.string(), v.isoTime('Heure attendue au format HH:MM.'));

const ShiftSubmissionSchema = v.pipe(
	v.object({
		employeeId: v.pipe(v.string(), v.uuid('Choisissez un employé.')),
		date: IsoDateSchema,
		startTime: TimeOfDaySchema,
		endTime: TimeOfDaySchema
	}),
	v.check(({ startTime, endTime }) => startTime < endTime, 'La fin du créneau doit venir après son début.')
);

const UuidSchema = v.pipe(v.string(), v.uuid());

export async function getWeekPlanning(tenantId: string, firstDate: string, lastDate: string): Promise<WeekPlanning> {
	const [pharmacyEmployees, shifts, absences] = await Promise.all([
		listEmployees(tenantId),
		listShifts(tenantId, firstDate, lastDate),
		listAbsences(tenantId, firstDate, lastDate)
	]);
	return { employees: pharmacyEmployees.map(toPlanningEmployee), shifts, absences };
}

/** Les plages d'ouverture de chaque date, dans l'ordre des dates données. */
export async function listOpeningPeriodsByDate(tenantId: string, dates: string[]): Promise<OpeningHours[][]> {
	const { weeklyOpeningSchedule } = await getPharmacyProfile(tenantId);
	return dates.map((date) => listOpeningPeriodsOfDate(weeklyOpeningSchedule, date));
}

export async function addShift(tenantId: string, submission: ShiftSubmission): Promise<ShiftSaveResult> {
	const validation = v.safeParse(ShiftSubmissionSchema, submission);
	if (!validation.success) return { isSaved: false, message: validation.issues[0].message };
	const newShift = validation.output;

	const { employees, shifts } = await getWeekPlanning(tenantId, newShift.date, newShift.date);
	// La clé étrangère vers l'employé ne passe pas par la Row-Level Security : c'est ici
	// qu'on refuse l'employé d'une autre pharmacie.
	const employee = employees.find((candidate) => candidate.id === newShift.employeeId);
	if (!employee) return { isSaved: false, message: 'Cet employé ne fait plus partie de l’équipe.' };

	const overlappingShift = findOverlappingShift(shifts, newShift);
	if (overlappingShift) {
		return {
			isSaved: false,
			message: `${employee.fullName} travaille déjà ce jour-là sur ${formatShiftHours(overlappingShift)}.`
		};
	}

	await insertShift(tenantId, newShift);
	return { isSaved: true };
}

export async function removeShift(tenantId: string, shiftId: string): Promise<void> {
	if (!v.is(UuidSchema, shiftId)) return;
	await deleteShift(tenantId, shiftId);
}

function toPlanningEmployee(pharmacyEmployee: PharmacyEmployee): Employee {
	const jobTitle = pharmacyEmployee.jobTitle.toDisplayFormat();
	return {
		id: pharmacyEmployee.employeeId,
		fullName: formatEmployeeFullName(pharmacyEmployee),
		jobTitle,
		isPharmacist: isPharmacistJobTitle(jobTitle)
	};
}
