/*
 * PROVISOIRE : le schéma Drizzle `planning` (server/db/) et les Employees de
 * `shared/pharmacy` n'existent pas encore. Ce fichier imite ce dépôt avec des
 * données de démonstration en mémoire (perdues au redémarrage), pour que la
 * page soit utilisable ; il sera remplacé par des requêtes Drizzle, sans
 * toucher à la page. Aucune règle ici : chevauchements et contraintes de
 * présence iront dans server/services/.
 */
import type { OpeningHours } from '../../domain/coverage';
import type { Absence, Employee, Shift, WeekPlanning } from '../../domain/planning';
import { addDays, getMondayOfWeek, toCalendarDay, toIsoDate } from '../../domain/week';

export type NewShift = Omit<Shift, 'id'>;

const employees: Employee[] = [
	{ id: 'employee-helene-dubois', fullName: 'Hélène Dubois', jobTitle: 'Pharmacienne titulaire', isPharmacist: true },
	{ id: 'employee-lea-petit', fullName: 'Léa Petit', jobTitle: 'Pharmacien adjoint', isPharmacist: true },
	{ id: 'employee-camille-martin', fullName: 'Camille Martin', jobTitle: 'Préparatrice', isPharmacist: false },
	{ id: 'employee-thomas-roux', fullName: 'Thomas Roux', jobTitle: 'Préparateur', isPharmacist: false },
	{ id: 'employee-ines-nait', fullName: 'Inès Nait', jobTitle: 'Étudiante', isPharmacist: false },
	{ id: 'employee-yanis-benali', fullName: 'Yanis Benali', jobTitle: 'Apprenti', isPharmacist: false }
];

const currentMonday = getMondayOfWeek(toCalendarDay(new Date()));

function dateInCurrentWeek(dayIndex: number): string {
	return toIsoDate(addDays(currentMonday, dayIndex));
}

/** Les créneaux de la semaine en cours, jour par jour (0 = lundi), repris de la maquette EcranPlanning. */
const demonstrationShiftsByEmployee: Record<string, [dayIndex: number, startTime: string, endTime: string][]> = {
	'employee-helene-dubois': [[0, '08:30', '12:30'], [0, '14:00', '19:30'], [1, '08:30', '12:30'], [3, '08:30', '12:30'], [3, '14:00', '18:00'], [5, '09:00', '12:30']],
	'employee-lea-petit': [[1, '14:00', '19:30'], [2, '08:30', '12:30'], [2, '14:00', '19:30'], [3, '14:00', '18:00'], [4, '08:30', '12:30'], [4, '14:00', '19:30'], [5, '09:00', '12:30']],
	'employee-camille-martin': [[0, '09:00', '13:00'], [1, '09:00', '13:00'], [1, '14:00', '18:00'], [2, '14:00', '19:30'], [4, '09:00', '13:00'], [4, '14:00', '18:00']],
	'employee-thomas-roux': [[0, '14:00', '19:30'], [1, '08:30', '12:30'], [2, '08:30', '12:30'], [2, '14:00', '19:30'], [3, '08:30', '12:30'], [4, '14:00', '19:30'], [5, '09:00', '12:30']],
	'employee-ines-nait': [[2, '14:00', '19:30'], [5, '09:00', '12:30']],
	'employee-yanis-benali': [[3, '14:00', '19:30'], [4, '08:30', '12:30']]
};

let shifts: Shift[] = Object.entries(demonstrationShiftsByEmployee).flatMap(([employeeId, employeeShifts]) =>
	employeeShifts.map(([dayIndex, startTime, endTime]) => ({
		id: crypto.randomUUID(),
		employeeId,
		date: dateInCurrentWeek(dayIndex),
		startTime,
		endTime
	}))
);

const absences: Absence[] = [
	{ id: 'absence-helene-dubois', employeeId: 'employee-helene-dubois', firstDate: dateInCurrentWeek(4), lastDate: dateInCurrentWeek(4), kind: 'RTT' },
	{ id: 'absence-yanis-benali', employeeId: 'employee-yanis-benali', firstDate: dateInCurrentWeek(0), lastDate: dateInCurrentWeek(2), kind: 'Congé' }
];

const sundayDayIndex = 0;
const demonstrationOpeningHours: OpeningHours = { opensAt: '08:30', closesAt: '19:30' };

/** Les horaires d'ouverture du jour (`undefined` s'il est fermé) : du lundi au samedi, 08:30–19:30. */
export async function getOpeningHours(date: string): Promise<OpeningHours | undefined> {
	const isSunday = new Date(`${date}T00:00:00Z`).getUTCDay() === sundayDayIndex;
	return isSunday ? undefined : demonstrationOpeningHours;
}

export async function getWeekPlanning(firstDate: string, lastDate: string): Promise<WeekPlanning> {
	return {
		employees,
		shifts: shifts.filter((shift) => firstDate <= shift.date && shift.date <= lastDate),
		absences: absences.filter((absence) => absence.firstDate <= lastDate && firstDate <= absence.lastDate)
	};
}

export async function addShift(newShift: NewShift): Promise<void> {
	shifts = [...shifts, { id: crypto.randomUUID(), ...newShift }];
}

export async function deleteShift(shiftId: string): Promise<void> {
	shifts = shifts.filter((shift) => shift.id !== shiftId);
}
