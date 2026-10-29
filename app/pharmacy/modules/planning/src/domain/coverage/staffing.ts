export type MinuteInterval = {
	startMinutes: number;
	endMinutes: number;
};

/** Une plage de la journée où l'effectif demandé monte (une heure de pointe). */
export type RequirementWindow = MinuteInterval & {
	requiredCount: number;
};

export type StaffingSegment = MinuteInterval & {
	presentCount: number;
	requiredCount: number;
	isSufficient: boolean;
};

/**
 * Découpe les plages d'ouverture en segments où l'effectif présent suffit ou non.
 * L'effectif demandé est `baseRequiredCount`, relevé par les `requirementWindows` qui couvrent le segment.
 */
export function computeStaffing(
	openingIntervals: MinuteInterval[],
	presentIntervals: MinuteInterval[],
	requirementWindows: RequirementWindow[],
	baseRequiredCount: number
): StaffingSegment[] {
	const segments = openingIntervals.flatMap((opening) => {
		const breakpoints = listBreakpoints(opening, presentIntervals, requirementWindows);
		return breakpoints.slice(0, -1).map((startMinutes, index): StaffingSegment => {
			const endMinutes = breakpoints[index + 1] ?? startMinutes;
			const presentCount = presentIntervals.filter((interval) => covers(interval, startMinutes)).length;
			const requiredCount = Math.max(
				baseRequiredCount,
				...requirementWindows.filter((window) => covers(window, startMinutes)).map((window) => window.requiredCount)
			);
			return { startMinutes, endMinutes, presentCount, requiredCount, isSufficient: presentCount >= requiredCount };
		});
	});
	return mergeNeighbouringSegments(segments);
}

export function listInsufficientSegments(segments: StaffingSegment[]): StaffingSegment[] {
	return segments.filter((segment) => !segment.isSufficient);
}

function covers(interval: MinuteInterval, minutes: number): boolean {
	return interval.startMinutes <= minutes && minutes < interval.endMinutes;
}

function listBreakpoints(
	opening: MinuteInterval,
	presentIntervals: MinuteInterval[],
	requirementWindows: RequirementWindow[]
): number[] {
	const candidates = [...presentIntervals, ...requirementWindows].flatMap((interval) => [
		interval.startMinutes,
		interval.endMinutes
	]);
	const insideOpening = candidates.filter(
		(minutes) => opening.startMinutes < minutes && minutes < opening.endMinutes
	);
	return [...new Set([opening.startMinutes, ...insideOpening, opening.endMinutes])].sort((first, second) => first - second);
}

function mergeNeighbouringSegments(segments: StaffingSegment[]): StaffingSegment[] {
	return segments.reduce<StaffingSegment[]>((merged, segment) => {
		const last = merged.at(-1);
		const continuesLast =
			last &&
			last.endMinutes === segment.startMinutes &&
			last.presentCount === segment.presentCount &&
			last.requiredCount === segment.requiredCount;
		if (continuesLast) last.endMinutes = segment.endMinutes;
		else merged.push({ ...segment });
		return merged;
	}, []);
}
