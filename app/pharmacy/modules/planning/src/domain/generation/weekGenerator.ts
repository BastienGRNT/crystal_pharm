import { findActivityDuringRange, sumTrainingMinutes } from '../activities/plannedActivities';
import { findBlockingRule, doesRuleApplyOnDate } from '../availability/availabilityRules';
import { computeOvertimePremiumMinutes } from '../overtime/overtimePay';
import { formatTimeOfDay } from '../coverage/coverage';
import { findAbsenceOfDay, toMinutesSinceMidnight } from '../planning';
import {
	generationLimits,
	type GenerationEmployee,
	type GenerationGap,
	type GenerationGapKind,
	type GenerationInput,
	type GenerationResult
} from './generationTypes';

type WorkingShift = {
	employeeId: string;
	dayIndex: number;
	startMinutes: number;
	endMinutes: number;
	reasons: string[];
	isProposed: boolean;
	/** Pour un créneau déjà posé : de quoi le retrouver en base, et savoir s'il a été allongé. */
	existingShiftId?: string;
	isExtended?: boolean;
};

type Period = { startMinutes: number; endMinutes: number };

type Candidate = {
	employee: GenerationEmployee;
	startMinutes: number;
	endMinutes: number;
	mergedInto: WorkingShift | undefined;
	score: number;
	reasons: string[];
};

type GenerationState = { input: GenerationInput; shifts: WorkingShift[]; gaps: GenerationGap[] };

const { slotMinutes } = generationLimits;

/**
 * Comble ce qui manque dans la semaine : d'abord les pharmaciens, puis l'effectif, jour après jour,
 * en choisissant pour chaque trou la personne qui coûte le moins en respectant toutes les contraintes dures.
 * Les créneaux déjà posés sont gardés ; ce que personne ne peut tenir ressort en `gaps`.
 */
export function generateWeek(input: GenerationInput): GenerationResult {
	const state: GenerationState = { input, shifts: listExistingWorkingShifts(input), gaps: [] };
	input.weekDates.forEach((_, dayIndex) => {
		if (isFrozenDay(state, dayIndex)) return;
		fillDeficits(state, dayIndex, 'pharmacist');
		fillDeficits(state, dayIndex, 'people');
	});
	topUpContracts(state);
	return {
		extendedShifts: state.shifts
			.filter((shift) => shift.isExtended && shift.existingShiftId !== undefined)
			.map((shift) => ({
				shiftId: shift.existingShiftId ?? '',
				employeeId: shift.employeeId,
				date: input.weekDates[shift.dayIndex] ?? '',
				startTime: formatTimeOfDay(shift.startMinutes),
				endTime: formatTimeOfDay(shift.endMinutes),
				reason: describeReason(state, shift)
			})),
		proposedShifts: state.shifts
			.filter((shift) => shift.isProposed)
			.sort((first, second) => first.dayIndex - second.dayIndex || first.startMinutes - second.startMinutes)
			.map((shift) => ({
				employeeId: shift.employeeId,
				date: input.weekDates[shift.dayIndex] ?? '',
				startTime: formatTimeOfDay(shift.startMinutes),
				endTime: formatTimeOfDay(shift.endMinutes),
				reason: describeReason(state, shift)
			})),
		gaps: state.gaps
	};
}

function listExistingWorkingShifts({ existingShifts, weekDates }: GenerationInput): WorkingShift[] {
	return existingShifts.flatMap((shift) => {
		const dayIndex = weekDates.indexOf(shift.date);
		if (dayIndex < 0) return [];
		return [
			{
				employeeId: shift.employeeId,
				dayIndex,
				startMinutes: toMinutesSinceMidnight(shift.startTime),
				endMinutes: toMinutesSinceMidnight(shift.endTime),
				reasons: [],
				isProposed: false,
				existingShiftId: shift.id
			}
		];
	});
}

function describeReason(state: GenerationState, shift: WorkingShift): string {
	const employee = findEmployee(state, shift.employeeId);
	const reasons = shift.reasons.length > 0 ? shift.reasons : ['complète l’équipe'];
	return `${employee?.fullName ?? 'Quelqu’un'} : ${reasons.join(', ')}.`;
}

function findEmployee(state: GenerationState, employeeId: string): GenerationEmployee | undefined {
	return state.input.employees.find((employee) => employee.id === employeeId);
}

function isFrozenDay(state: GenerationState, dayIndex: number): boolean {
	return (state.input.weekDates[dayIndex] ?? '') < state.input.firstEditableDate;
}

function listPeriods(state: GenerationState, dayIndex: number): Period[] {
	return (state.input.openingPeriodsByDate[dayIndex] ?? []).map((period) => ({
		startMinutes: toMinutesSinceMidnight(period.opensAt),
		endMinutes: toMinutesSinceMidnight(period.closesAt)
	}));
}

function isAbsent(state: GenerationState, employeeId: string, dayIndex: number): boolean {
	return findAbsenceOfDay(state.input.absences, employeeId, state.input.weekDates[dayIndex] ?? '') !== undefined;
}

function countPresent(state: GenerationState, dayIndex: number, minute: number, pharmacistsOnly: boolean): number {
	return state.shifts.filter((shift) => {
		if (shift.dayIndex !== dayIndex || shift.startMinutes > minute || minute >= shift.endMinutes) return false;
		if (isAbsent(state, shift.employeeId, dayIndex)) return false;
		return !pharmacistsOnly || findEmployee(state, shift.employeeId)?.isPharmacist === true;
	}).length;
}

function readRequiredCount(state: GenerationState, dayIndex: number, minute: number, kind: GenerationGapKind): number {
	const { rules, requirementWindowsByDate } = state.input;
	if (kind === 'pharmacist') return rules.minimumPharmacistsPresent;
	const windows = (requirementWindowsByDate[dayIndex] ?? []).filter(
		(window) => window.startMinutes <= minute && minute < window.endMinutes
	);
	return Math.max(rules.minimumPeoplePresent, ...windows.map((window) => window.requiredCount));
}

function isPeakMinute(state: GenerationState, dayIndex: number, minute: number): boolean {
	return readRequiredCount(state, dayIndex, minute, 'people') > state.input.rules.minimumPeoplePresent;
}

function hasDeficit(state: GenerationState, dayIndex: number, minute: number, kind: GenerationGapKind): boolean {
	return countPresent(state, dayIndex, minute, kind === 'pharmacist') < readRequiredCount(state, dayIndex, minute, kind);
}

function fillDeficits(state: GenerationState, dayIndex: number, kind: GenerationGapKind): void {
	const unfillableMinutes = new Set<number>();
	for (const period of listPeriods(state, dayIndex)) {
		let minute = period.startMinutes;
		while (minute < period.endMinutes) {
			if (unfillableMinutes.has(minute) || !hasDeficit(state, dayIndex, minute, kind)) {
				minute += slotMinutes;
				continue;
			}
			const runEnd = findDeficitRunEnd(state, dayIndex, kind, period, minute, unfillableMinutes);
			const candidate = chooseBestCandidate(state, dayIndex, kind, period, minute, runEnd);
			if (!candidate) {
				recordGap(state, dayIndex, kind, minute, runEnd);
				for (let blocked = minute; blocked < runEnd; blocked += slotMinutes) unfillableMinutes.add(blocked);
				minute = runEnd;
				continue;
			}
			placeCandidate(state, dayIndex, candidate);
		}
	}
}

function findDeficitRunEnd(
	state: GenerationState,
	dayIndex: number,
	kind: GenerationGapKind,
	period: Period,
	startMinute: number,
	unfillableMinutes: Set<number>
): number {
	let end = startMinute + slotMinutes;
	while (end < period.endMinutes && hasDeficit(state, dayIndex, end, kind) && !unfillableMinutes.has(end)) end += slotMinutes;
	return Math.min(end, period.endMinutes);
}

function recordGap(state: GenerationState, dayIndex: number, kind: GenerationGapKind, startMinutes: number, endMinutes: number): void {
	const missing = kind === 'pharmacist' ? 'Aucun pharmacien disponible' : 'Personne de disponible';
	const manualPharmacistNames = state.input.employees
		.filter((employee) => employee.isPlannedManually && (kind === 'people' || employee.isPharmacist) && !isAbsent(state, employee.id, dayIndex))
		.map((employee) => employee.fullName);
	const manualHint = manualPharmacistNames.length > 0 ? ` Seuls ${manualPharmacistNames.join(', ')} (horaires posés par le titulaire) pourraient le tenir.` : '';
	state.gaps.push({
		date: state.input.weekDates[dayIndex] ?? '',
		kind,
		startMinutes,
		endMinutes,
		message: `${missing} de ${formatTimeOfDay(startMinutes)} à ${formatTimeOfDay(endMinutes)}.${manualHint}`
	});
}

function chooseBestCandidate(
	state: GenerationState,
	dayIndex: number,
	kind: GenerationGapKind,
	period: Period,
	startMinute: number,
	runEnd: number
): Candidate | undefined {
	const eligibleEmployees = state.input.employees.filter(
		(employee) => !employee.isPlannedManually && (kind === 'people' || employee.isPharmacist)
	);
	const candidates = eligibleEmployees.flatMap((employee) => {
		const candidate = buildCandidate(state, employee, dayIndex, kind, period, startMinute, runEnd);
		return candidate ? [candidate] : [];
	});
	if (candidates.length === 0) return undefined;
	const best = candidates.reduce((current, other) => (other.score < current.score ? other : current));
	if (candidates.length === 1) best.reasons.unshift(kind === 'pharmacist' ? 'seul pharmacien disponible' : 'seul disponible');
	return best;
}

function buildCandidate(
	state: GenerationState,
	employee: GenerationEmployee,
	dayIndex: number,
	kind: GenerationGapKind,
	period: Period,
	startMinute: number,
	runEnd: number
): Candidate | undefined {
	if (isAbsent(state, employee.id, dayIndex)) return undefined;
	const { rules } = state.input;
	const minimumLength = Math.min(rules.minimumShiftMinutes, period.endMinutes - period.startMinutes);

	const wantedEnd = Math.min(period.endMinutes, Math.max(runEnd, startMinute + minimumLength), startMinute + generationLimits.maximumContinuousMinutes);
	const end = extendWhileFree(state, employee, dayIndex, startMinute, wantedEnd);
	if (end <= startMinute) return undefined;
	let start = startMinute;
	while (end - start < minimumLength && start - slotMinutes >= period.startMinutes && isRangeFree(state, employee, dayIndex, start - slotMinutes, start)) {
		start -= slotMinutes;
	}
	if (end - start < minimumLength) return undefined;

	const mergedInto = state.shifts.find(
		(shift) =>
			shift.employeeId === employee.id && shift.dayIndex === dayIndex && shift.endMinutes === start &&
			end - shift.startMinutes <= generationLimits.maximumContinuousMinutes
	);
	if (!respectsHardLimits(state, employee, dayIndex, start, end, mergedInto !== undefined)) return undefined;

	return scoreCandidate(state, employee, dayIndex, kind, start, end, mergedInto);
}

function extendWhileFree(state: GenerationState, employee: GenerationEmployee, dayIndex: number, start: number, wantedEnd: number): number {
	let end = start;
	while (end < wantedEnd) {
		const nextEnd = Math.min(end + slotMinutes, wantedEnd);
		if (!isRangeFree(state, employee, dayIndex, end, nextEnd)) break;
		end = nextEnd;
	}
	return end;
}

function isRangeFree(state: GenerationState, employee: GenerationEmployee, dayIndex: number, start: number, end: number): boolean {
	const date = state.input.weekDates[dayIndex] ?? '';
	const isBlocked =
		findBlockingRule(state.input.availabilityRules, employee.id, date, formatTimeOfDay(start), formatTimeOfDay(end)) ??
		findActivityDuringRange(state.input.plannedActivities, employee.id, date, formatTimeOfDay(start), formatTimeOfDay(end));
	if (isBlocked) return false;
	return !state.shifts.some(
		(shift) => shift.employeeId === employee.id && shift.dayIndex === dayIndex && shift.startMinutes < end && start < shift.endMinutes
	);
}

function listEmployeeShifts(state: GenerationState, employeeId: string, dayIndex: number): WorkingShift[] {
	return state.shifts.filter((shift) => shift.employeeId === employeeId && shift.dayIndex === dayIndex);
}

function sumEmployeeMinutes(shifts: WorkingShift[]): number {
	return shifts.reduce((total, shift) => total + shift.endMinutes - shift.startMinutes, 0);
}

/** Le temps de travail de la journée (ou de la semaine sans `dayIndex`) : ses créneaux et ses formations. */
function sumWorkedMinutes(state: GenerationState, employeeId: string, dayIndex?: number): number {
	const shifts = state.shifts.filter((shift) => shift.employeeId === employeeId && (dayIndex === undefined || shift.dayIndex === dayIndex));
	const date = dayIndex === undefined ? undefined : (state.input.weekDates[dayIndex] ?? '');
	return sumEmployeeMinutes(shifts) + sumTrainingMinutes(state.input.plannedActivities, employeeId, date);
}

function respectsHardLimits(
	state: GenerationState,
	employee: GenerationEmployee,
	dayIndex: number,
	start: number,
	end: number,
	isMerged: boolean,
	isContractTopUp = false
): boolean {
	const { rules } = state.input;
	const dayShifts = listEmployeeShifts(state, employee.id, dayIndex);
	const added = end - start;
	if (!isMerged && !isContractTopUp && dayShifts.length + 1 > rules.maximumShiftsPerDay) return false;
	if (sumWorkedMinutes(state, employee.id, dayIndex) + added > generationLimits.maximumDailyMinutes) return false;
	if (sumWorkedMinutes(state, employee.id) + added > generationLimits.maximumWeeklyMinutes) return false;

	const previousEnd = Math.max(-Infinity, ...listEmployeeShifts(state, employee.id, dayIndex - 1).map((shift) => shift.endMinutes));
	if (Number.isFinite(previousEnd) && 24 * 60 - previousEnd + start < rules.minimumRestMinutes) return false;
	const nextStart = Math.min(Infinity, ...listEmployeeShifts(state, employee.id, dayIndex + 1).map((shift) => shift.startMinutes));
	if (Number.isFinite(nextStart) && 24 * 60 - end + nextStart < rules.minimumRestMinutes) return false;
	return true;
}

function computeMarginalCostEuros(state: GenerationState, employee: GenerationEmployee, weekMinutes: number, addedMinutes: number): number {
	const { overtimeRules } = state.input;
	const contractMinutes = employee.weeklyContractMinutes ?? 0;
	const freeMinutes = Math.max(0, Math.min(addedMinutes, contractMinutes - weekMinutes));
	const paidMinutes = addedMinutes - freeMinutes;
	const addedPremiumMinutes =
		computeOvertimePremiumMinutes(weekMinutes + addedMinutes, overtimeRules) - computeOvertimePremiumMinutes(weekMinutes, overtimeRules);
	const hourlyRateEuros = (employee.hourlyRateCents ?? generationLimits.defaultHourlyRateCents) / 100;
	return (hourlyRateEuros * (paidMinutes + addedPremiumMinutes)) / 60;
}

const newShiftPenalty = 3;
const pharmacistOnPeopleNeedPenalty = 1.5;
const fairnessWeightPerHour = 0.1;
const proposedAvailabilityBonus = 2;

function scoreCandidate(
	state: GenerationState,
	employee: GenerationEmployee,
	dayIndex: number,
	kind: GenerationGapKind,
	start: number,
	end: number,
	mergedInto: WorkingShift | undefined
): Candidate {
	const weekMinutes = sumWorkedMinutes(state, employee.id);
	const addedMinutes = end - start;
	const cost = computeMarginalCostEuros(state, employee, weekMinutes, addedMinutes);
	const contractMinutes = employee.weeklyContractMinutes ?? 0;
	const remainingContractMinutes = Math.max(0, contractMinutes - weekMinutes);
	const isPeak = isPeakMinute(state, dayIndex, start);
	const date = state.input.weekDates[dayIndex] ?? '';
	const hasProposedAvailability = state.input.availabilityRules.some(
		(rule) =>
			rule.employeeId === employee.id && rule.kind === 'available' && doesRuleApplyOnDate(rule, date) &&
			toMinutesSinceMidnight(rule.startTime) <= start && end <= toMinutesSinceMidnight(rule.endTime)
	);

	let score = cost + (weekMinutes / 60) * fairnessWeightPerHour;
	const reasons: string[] = [];
	if (remainingContractMinutes > 0) reasons.push(`sous son contrat (${Math.round(remainingContractMinutes / 60)} h à compléter)`);
	else if (employee.hourlyRateCents !== undefined && cost > 0) reasons.push(`tarif de ${(employee.hourlyRateCents / 100).toLocaleString('fr-FR')} €/h`);
	if (isPeak && employee.isStudent) reasons.push('étudiant sur une heure de pointe');
	else if (isPeak) reasons.push('heure de pointe');
	if (mergedInto) reasons.push('prolonge sa plage');
	else score += newShiftPenalty;
	if (kind === 'people' && employee.isPharmacist) score += pharmacistOnPeopleNeedPenalty;
	if (hasProposedAvailability) {
		score -= proposedAvailabilityBonus;
		reasons.push('s’est proposé à cette heure');
	}
	return { employee, startMinutes: start, endMinutes: end, mergedInto, score, reasons };
}

function placeCandidate(state: GenerationState, dayIndex: number, candidate: Candidate): void {
	if (candidate.mergedInto) {
		candidate.mergedInto.endMinutes = candidate.endMinutes;
		if (!candidate.mergedInto.isProposed) {
			candidate.mergedInto.isExtended = true;
			candidate.mergedInto.reasons.push(...candidate.reasons, 'prolonge son créneau');
		}
		return;
	}
	state.shifts.push({
		employeeId: candidate.employee.id,
		dayIndex,
		startMinutes: candidate.startMinutes,
		endMinutes: candidate.endMinutes,
		reasons: candidate.reasons,
		isProposed: true
	});
}

/** Les heures du contrat que les trous n'ont pas suffi à donner : un employé doit faire ses heures, on les pose donc quoi qu'il arrive. */
function topUpContracts(state: GenerationState): void {
	const { rules } = state.input;
	const employeesByDeficit = state.input.employees
		.filter((employee) => !employee.isPlannedManually && employee.weeklyContractMinutes !== undefined)
		.sort((first, second) => deficitOf(state, second) - deficitOf(state, first));

	for (const employee of employeesByDeficit) {
		let remaining = deficitOf(state, employee);
		while (remaining > 0) {
			const wantedMinutes = Math.ceil(remaining / slotMinutes) * slotMinutes;
			const extension = findShiftExtension(state, employee, wantedMinutes);
			if (extension) {
				extension.shift.endMinutes += extension.addedMinutes;
				extension.shift.reasons.push('complète son contrat');
				if (!extension.shift.isProposed) extension.shift.isExtended = true;
				remaining -= extension.addedMinutes;
				continue;
			}
			const placement = findLeastStaffedPlacement(state, employee, Math.max(wantedMinutes, rules.minimumShiftMinutes));
			if (!placement) break;
			state.shifts.push({ ...placement, employeeId: employee.id, reasons: ['complète son contrat'], isProposed: true });
			remaining -= placement.endMinutes - placement.startMinutes;
		}
	}
}

/** Allonger une plage déjà là vaut mieux qu'en ouvrir une autre : moins de coupures dans la journée. */
function findShiftExtension(
	state: GenerationState,
	employee: GenerationEmployee,
	wantedMinutes: number
): { shift: WorkingShift; addedMinutes: number } | undefined {
	const employeeShifts = state.shifts.filter((shift) => shift.employeeId === employee.id);
	for (const shift of employeeShifts) {
		if (isFrozenDay(state, shift.dayIndex)) continue;
		const period = listPeriods(state, shift.dayIndex).find((candidate) => candidate.startMinutes <= shift.startMinutes && shift.endMinutes <= candidate.endMinutes);
		if (!period) continue;
		const room = Math.min(wantedMinutes, period.endMinutes - shift.endMinutes, generationLimits.maximumContinuousMinutes - (shift.endMinutes - shift.startMinutes));
		const addedMinutes = Math.floor(room / slotMinutes) * slotMinutes;
		if (addedMinutes <= 0) continue;
		const newEnd = shift.endMinutes + addedMinutes;
		if (isRangeFree(state, employee, shift.dayIndex, shift.endMinutes, newEnd) && respectsHardLimits(state, employee, shift.dayIndex, shift.endMinutes, newEnd, true, true)) {
			return { shift, addedMinutes };
		}
	}
	return undefined;
}

function deficitOf(state: GenerationState, employee: GenerationEmployee): number {
	return Math.max(0, (employee.weeklyContractMinutes ?? 0) - sumWorkedMinutes(state, employee.id));
}

function findLeastStaffedPlacement(
	state: GenerationState,
	employee: GenerationEmployee,
	remainingMinutes: number
): Pick<WorkingShift, 'dayIndex' | 'startMinutes' | 'endMinutes' | 'isProposed'> | undefined {
	const { rules } = state.input;
	const length = Math.min(remainingMinutes, 4 * 60, generationLimits.maximumContinuousMinutes);
	const options = state.input.weekDates.flatMap((_, dayIndex) =>
		isAbsent(state, employee.id, dayIndex) || isFrozenDay(state, dayIndex)
			? []
			: listPeriods(state, dayIndex).flatMap((period) => {
					const periodLength = period.endMinutes - period.startMinutes;
					const wanted = Math.min(length, periodLength);
					if (wanted < Math.min(rules.minimumShiftMinutes, periodLength)) return [];
					return [period.startMinutes, period.endMinutes - wanted]
						.map((start) => ({ dayIndex, startMinutes: start, endMinutes: start + wanted, isProposed: true }))
						.filter(
							(option) =>
								isRangeFree(state, employee, dayIndex, option.startMinutes, option.endMinutes) &&
								respectsHardLimits(state, employee, dayIndex, option.startMinutes, option.endMinutes, false, true)
						);
				})
	);
	if (options.length === 0) return undefined;
	const thinnest = (option: (typeof options)[number]) => countPresent(state, option.dayIndex, option.startMinutes, false);
	return options.reduce((current, other) => (thinnest(other) < thinnest(current) ? other : current));
}
