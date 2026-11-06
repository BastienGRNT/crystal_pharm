export type LevelBarEditorColumn = {
	key: string;
	/** Le début et la fin de la colonne (« 10:00 », « 10:30 »), pour dire ce qui est choisi. */
	startLabel: string;
	endLabel: string;
	/** Écrit sous l'axe ; sans lui, la colonne n'a pas d'étiquette visible. */
	axisLabel?: string;
	value: number;
	/** Une colonne qu'on ne règle pas (une pause) : dessinée en creux, sautée par le clavier. */
	isDisabled?: boolean;
};

/** Les colonnes voisines désactivées sont dessinées d'un seul tenant. */
export type LevelBarEditorSegment =
	| { kind: 'column'; columnIndex: number }
	| { kind: 'gap'; key: string; columnCount: number };

export function groupLevelBarEditorSegments(columns: readonly LevelBarEditorColumn[]): LevelBarEditorSegment[] {
	const segments: LevelBarEditorSegment[] = [];
	columns.forEach((column, columnIndex) => {
		const lastSegment = segments.at(-1);
		if (!column.isDisabled) segments.push({ kind: 'column', columnIndex });
		else if (lastSegment?.kind === 'gap') lastSegment.columnCount += 1;
		else segments.push({ kind: 'gap', key: column.key, columnCount: 1 });
	});
	return segments;
}

/** Une graduation lisible : au plus six traits, à pas entier. */
export function listLevelTicks(scaleMaximum: number): number[] {
	const step = Math.max(1, Math.ceil(scaleMaximum / 6));
	const ticks: number[] = [];
	for (let tick = 0; tick <= scaleMaximum; tick += step) ticks.push(tick);
	return ticks;
}
