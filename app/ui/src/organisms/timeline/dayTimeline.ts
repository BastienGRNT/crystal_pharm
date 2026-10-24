export type DayTimelineHour = { label: string; percent: number };

export type DayTimelineBarTone = 'accent' | 'neutral' | 'pending';

export type DayTimelineBar = {
	id: string;
	label: string;
	detail?: string;
	startPercent: number;
	widthPercent: number;
	tone: DayTimelineBarTone;
	href?: string;
};

export type DayTimelineRow = {
	key: string;
	label: string;
	bars: DayTimelineBar[];
	emptyLabel?: string;
};

/** Un intervalle à signaler sur toute la hauteur de la frise (un manque, une alerte). */
export type DayTimelineGap = {
	key: string;
	label: string;
	startPercent: number;
	widthPercent: number;
};

export type DayTimelineNow = { percent: number; label: string };

/** Les barres d'une ligne réparties sur des voies : deux barres qui se chevauchent ne partagent jamais une voie. */
export function arrangeBarsInLanes(bars: DayTimelineBar[]): DayTimelineBar[][] {
	const sortedBars = [...bars].sort((first, second) => first.startPercent - second.startPercent);
	const lanes: DayTimelineBar[][] = [];
	for (const bar of sortedBars) {
		const freeLane = lanes.find((lane) => endPercentOf(lane.at(-1)) <= bar.startPercent);
		if (freeLane) {
			freeLane.push(bar);
		} else {
			lanes.push([bar]);
		}
	}
	return lanes;
}

function endPercentOf(bar: DayTimelineBar | undefined): number {
	return bar ? bar.startPercent + bar.widthPercent : 0;
}
