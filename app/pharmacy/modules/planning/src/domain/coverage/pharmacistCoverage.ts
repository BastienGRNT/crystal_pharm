import { computeCoverageOfOpeningPeriods, type CoverageSegment, type OpeningHours } from './coverage';
import type { PlanningRow } from '../planning';

/**
 * La règle « un pharmacien présent pendant toute l'ouverture » : seuls comptent les
 * créneaux des pharmaciens qui ne sont pas absents ce jour-là. La pharmacie fixe leur nombre minimal.
 */
export function computePharmacistCoverage(
	planningRows: PlanningRow[],
	dayIndex: number,
	openingPeriods: OpeningHours[],
	minimumPharmacistsPresent = 1
): CoverageSegment[] {
	const presentPharmacistShifts = planningRows
		.filter((planningRow) => planningRow.employee.isPharmacist)
		.flatMap((planningRow) => {
			const cell = planningRow.cells[dayIndex];
			return cell && cell.absenceKind === undefined ? cell.shifts : [];
		});
	return computeCoverageOfOpeningPeriods(openingPeriods, presentPharmacistShifts, minimumPharmacistsPresent);
}
