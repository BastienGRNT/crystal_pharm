import { computeCoverage, type CoverageSegment, type OpeningHours } from '../../domain/coverage';
import type { PlanningRow } from '../../domain/planning';

/**
 * La règle « un pharmacien présent pendant toute l'ouverture » : seuls comptent les
 * créneaux des pharmaciens qui ne sont pas absents ce jour-là.
 */
export function computePharmacistCoverage(
	planningRows: PlanningRow[],
	dayIndex: number,
	openingHours: OpeningHours
): CoverageSegment[] {
	const presentPharmacistShifts = planningRows
		.filter((planningRow) => planningRow.employee.isPharmacist)
		.flatMap((planningRow) => {
			const cell = planningRow.cells[dayIndex];
			return cell && cell.absenceKind === undefined ? cell.shifts : [];
		});
	return computeCoverage(openingHours, presentPharmacistShifts);
}
