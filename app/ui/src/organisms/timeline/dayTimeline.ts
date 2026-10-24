import type { ModuleKey } from '../../modules';

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

/** Un intervalle de la frise, en pourcentage de sa largeur. */
export type DayTimelineRange = { startPercent: number; widthPercent: number };

/** Un intervalle à signaler sur une ligne : un manque, une alerte. */
export type DayTimelineGap = DayTimelineRange & {
	key: string;
	label: string;
};

export type DayTimelineRow = {
	key: string;
	label: string;
	bars: DayTimelineBar[];
	emptyLabel?: string;
	/** La couleur de la ligne : l'accent de ce module. */
	module?: ModuleKey;
	gaps?: DayTimelineGap[];
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
