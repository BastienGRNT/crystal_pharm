export type LaneCandidate = {
	key: string;
	startMinutes: number;
	endMinutes: number;
};

export type LaneAssignment = {
	laneByKey: Map<string, number>;
	laneCount: number;
};

/**
 * Range les plages côte à côte avec le moins de voies possible : deux plages qui ne se croisent pas
 * (quelqu'un du matin, quelqu'un du soir) partagent une voie, et les voies restent assez larges pour se lire.
 */
export function assignLanes(candidates: LaneCandidate[]): LaneAssignment {
	const laneEnds: number[] = [];
	const laneByKey = new Map<string, number>();
	const byStart = [...candidates].sort((first, second) => first.startMinutes - second.startMinutes || first.endMinutes - second.endMinutes);
	for (const candidate of byStart) {
		const freeLane = laneEnds.findIndex((laneEnd) => laneEnd <= candidate.startMinutes);
		const lane = freeLane === -1 ? laneEnds.length : freeLane;
		laneEnds[lane] = candidate.endMinutes;
		laneByKey.set(candidate.key, lane);
	}
	return { laneByKey, laneCount: Math.max(laneEnds.length, 1) };
}
