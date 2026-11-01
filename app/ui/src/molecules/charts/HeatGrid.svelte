<script lang="ts">
	import type { HeatGridRow } from './heatGrid';

	type HeatGridProps = {
		label: string;
		rows: HeatGridRow[];
		/** Une étiquette par colonne ; une vide n'écrit rien (on n'écrit qu'une heure sur deux). */
		columnLabels: string[];
		/** Ce que dit la ligne sous la grille tant que rien n'est survolé. */
		idleReadout: string;
	};

	let { label, rows, columnLabels, idleReadout }: HeatGridProps = $props();

	let hoveredCellLabel: string | undefined = $state();

	const highestValue = $derived(Math.max(0, ...rows.flatMap((row) => row.cells.map((cell) => cell.value))));

	// Quatre paliers d'une seule teinte, du pâle au plein : l'œil compare des intensités, pas des couleurs.
	const intensityClasses = ['bg-surface-muted', 'bg-accent/20', 'bg-accent/45', 'bg-accent/70', 'bg-accent'];

	function intensityClassOf(value: number): string {
		if (value === 0 || highestValue === 0) return intensityClasses[0] ?? '';
		const step = Math.ceil((value / highestValue) * (intensityClasses.length - 1));
		return intensityClasses[step] ?? '';
	}
</script>

<figure class="grid gap-2">
	<table class="sr-only">
		<caption>{label}</caption>
		<tbody>
			{#each rows as row (row.key)}
				{#each row.cells.filter((cell) => cell.value > 0) as cell (cell.label)}
					<tr><td>{cell.label}</td></tr>
				{/each}
			{/each}
		</tbody>
	</table>
	<div
		aria-hidden="true"
		class="grid items-center gap-0.5"
		style:grid-template-columns="auto repeat({columnLabels.length}, minmax(0, 1fr))"
		onpointerleave={() => (hoveredCellLabel = undefined)}
	>
		{#each rows as row (row.key)}
			<span class="pr-1.5 text-label text-ink-muted">{row.label}</span>
			{#each row.cells as cell, cellIndex (cellIndex)}
				<span
					role="presentation"
					class="h-5 rounded-xs {intensityClassOf(cell.value)} hover:ring-2 hover:ring-ink"
					onpointerenter={() => (hoveredCellLabel = cell.label)}
				></span>
			{/each}
		{/each}
		<span></span>
		{#each columnLabels as columnLabel, columnIndex (columnIndex)}
			<span class="pt-1 text-left text-label whitespace-nowrap text-ink-subtle">{columnLabel}</span>
		{/each}
	</div>

	<figcaption class="flex flex-wrap items-center justify-between gap-2 text-small text-ink-muted">
		<span aria-live="polite" class="font-semibold text-ink">{hoveredCellLabel ?? idleReadout}</span>
		<span aria-hidden="true" class="flex items-center gap-1 text-label text-ink-subtle">
			Moins
			{#each intensityClasses as intensityClass (intensityClass)}
				<span class="size-3 rounded-xs {intensityClass}"></span>
			{/each}
			Plus
		</span>
	</figcaption>

</figure>
