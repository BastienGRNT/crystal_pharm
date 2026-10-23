const minutesPerHour = 60;

export type AgendaHourRange = {
	firstHour: number;
	lastHour: number;
};

export type TimedItem = {
	id: string;
	startTime: string;
	endTime: string;
};

export type OverlapLane = {
	laneIndex: number;
	laneCount: number;
};

/** « 08:30 » → 510. */
export function toMinutesSinceMidnight(time: string): number {
	const [hours = 0, minutes = 0] = time.split(':').map(Number);
	return hours * minutesPerHour + minutes;
}

/** Les heures pleines affichées : la plage par défaut, élargie pour ne couper aucun rendez-vous. */
export function computeAgendaHourRange(items: readonly TimedItem[], defaultRange: AgendaHourRange): AgendaHourRange {
	let { firstHour, lastHour } = defaultRange;
	for (const item of items) {
		firstHour = Math.min(firstHour, Math.floor(toMinutesSinceMidnight(item.startTime) / minutesPerHour));
		lastHour = Math.max(lastHour, Math.ceil(toMinutesSinceMidnight(item.endTime) / minutesPerHour));
	}
	return { firstHour, lastHour };
}

export function listAgendaHours({ firstHour, lastHour }: AgendaHourRange): number[] {
	return Array.from({ length: lastHour - firstHour + 1 }, (_, hourIndex) => firstHour + hourIndex);
}

export function formatHour(hour: number): string {
	return `${String(hour).padStart(2, '0')}:00`;
}

/** La position d'une heure dans la plage, de 0 (début) à 100 (fin). */
export function toAgendaPercent(time: string, { firstHour, lastHour }: AgendaHourRange): number {
	const rangeStart = firstHour * minutesPerHour;
	const rangeLength = (lastHour - firstHour) * minutesPerHour;
	const percent = ((toMinutesSinceMidnight(time) - rangeStart) / rangeLength) * 100;
	return Math.min(100, Math.max(0, percent));
}

function overlaps(first: TimedItem, second: TimedItem): boolean {
	return (
		toMinutesSinceMidnight(first.startTime) < toMinutesSinceMidnight(second.endTime) &&
		toMinutesSinceMidnight(second.startTime) < toMinutesSinceMidnight(first.endTime)
	);
}

/**
 * Place côte à côte les éléments qui se chevauchent : chaque groupe d'éléments reliés par
 * des chevauchements partage la largeur en autant de couloirs qu'il en faut au plus fort.
 */
export function assignOverlapLanes(items: readonly TimedItem[]): Map<string, OverlapLane> {
	const sortedItems = [...items].sort(
		(first, second) => toMinutesSinceMidnight(first.startTime) - toMinutesSinceMidnight(second.startTime)
	);
	const lanes = new Map<string, OverlapLane>();
	let group: { item: TimedItem; laneIndex: number }[] = [];

	const closeGroup = (): void => {
		const laneCount = Math.max(0, ...group.map(({ laneIndex }) => laneIndex + 1));
		for (const { item, laneIndex } of group) lanes.set(item.id, { laneIndex, laneCount });
		group = [];
	};

	for (const item of sortedItems) {
		if (!group.some(({ item: groupedItem }) => overlaps(groupedItem, item))) closeGroup();
		const busyLanes = new Set(
			group.filter(({ item: groupedItem }) => overlaps(groupedItem, item)).map(({ laneIndex }) => laneIndex)
		);
		let laneIndex = 0;
		while (busyLanes.has(laneIndex)) laneIndex += 1;
		group.push({ item, laneIndex });
	}
	closeGroup();
	return lanes;
}
