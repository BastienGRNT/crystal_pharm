import { formatDayTitle } from '../calendar/week';
import { formatTimeOfDay } from '../coverage/coverage';
import { generationLimits, type GenerationGap, type GenerationGapKind, type GenerationInput } from '../generation/generationTypes';
import { generateWeek } from '../generation/weekGenerator';
import type { LeaveRequest } from './leaveRequests';

/** Une plage que l'équipe ne tiendrait plus si le congé était accepté. */
export type LeaveShortage = {
	date: string;
	kind: GenerationGapKind;
	startMinutes: number;
	endMinutes: number;
	message: string;
};

export type LeaveStaffingImpact = {
	isTeamSufficient: boolean;
	shortages: LeaveShortage[];
};

type LeaveUnderReview = Pick<LeaveRequest, 'employeeId' | 'firstDate' | 'lastDate' | 'kind'>;

const leaveUnderReviewId = 'leave-under-review';

/**
 * Le congé laisse-t-il assez de monde ? Pour chaque semaine qu'il touche, le générateur cherche
 * une équipe complète sans la personne, avec les disponibilités, contrats et limites légales des autres.
 * Ne comptent que les trous que le congé crée : ceux qui existeraient de toute façon ne sont pas de son fait.
 */
export function assessLeaveStaffingImpact(weekInputs: GenerationInput[], leave: LeaveUnderReview): LeaveStaffingImpact {
	const shortages = weekInputs.flatMap((weekInput) => {
		const gapsWithEmployee = generateWeek(weekInput).gaps;
		const gapsWithoutEmployee = generateWeek(withEmployeeOnLeave(weekInput, leave)).gaps;
		return subtractGaps(gapsWithoutEmployee, gapsWithEmployee).map(toLeaveShortage);
	});
	return { isTeamSufficient: shortages.length === 0, shortages };
}

function withEmployeeOnLeave(weekInput: GenerationInput, leave: LeaveUnderReview): GenerationInput {
	const isOnLeave = (employeeId: string, date: string) =>
		employeeId === leave.employeeId && leave.firstDate <= date && date <= leave.lastDate;
	return {
		...weekInput,
		absences: [...weekInput.absences, { id: leaveUnderReviewId, ...leave }],
		existingShifts: weekInput.existingShifts.filter((shift) => !isOnLeave(shift.employeeId, shift.date)),
		plannedActivities: weekInput.plannedActivities.filter((activity) => !isOnLeave(activity.employeeId, activity.date))
	};
}

/** Les plages de `gaps` qui ne sont pas déjà dans `existingGaps`, découpées au pas du générateur. */
function subtractGaps(gaps: GenerationGap[], existingGaps: GenerationGap[]): Omit<LeaveShortage, 'message'>[] {
	const existingSlotKeys = new Set(existingGaps.flatMap((gap) => listSlots(gap).map((slot) => slot.key)));
	const newSlots = gaps.flatMap(listSlots).filter((slot) => !existingSlotKeys.has(slot.key));
	return newSlots.reduce<Omit<LeaveShortage, 'message'>[]>((shortages, slot) => {
		const last = shortages.at(-1);
		if (last && last.date === slot.date && last.kind === slot.kind && last.endMinutes === slot.startMinutes) {
			last.endMinutes = slot.endMinutes;
		} else {
			shortages.push({ date: slot.date, kind: slot.kind, startMinutes: slot.startMinutes, endMinutes: slot.endMinutes });
		}
		return shortages;
	}, []);
}

type GapSlot = Omit<LeaveShortage, 'message'> & { key: string };

function listSlots(gap: GenerationGap): GapSlot[] {
	const slots: GapSlot[] = [];
	for (let startMinutes = gap.startMinutes; startMinutes < gap.endMinutes; startMinutes += generationLimits.slotMinutes) {
		slots.push({
			key: `${gap.date}|${gap.kind}|${startMinutes}`,
			date: gap.date,
			kind: gap.kind,
			startMinutes,
			endMinutes: Math.min(startMinutes + generationLimits.slotMinutes, gap.endMinutes)
		});
	}
	return slots;
}

function toLeaveShortage(shortage: Omit<LeaveShortage, 'message'>): LeaveShortage {
	const missing = shortage.kind === 'pharmacist' ? 'il manquerait un pharmacien' : 'il manquerait du monde au comptoir';
	const dayTitle = formatDayTitle(new Date(`${shortage.date}T00:00:00Z`));
	return {
		...shortage,
		message: `${dayTitle}, ${missing} de ${formatTimeOfDay(shortage.startMinutes)} à ${formatTimeOfDay(shortage.endMinutes)}.`
	};
}
