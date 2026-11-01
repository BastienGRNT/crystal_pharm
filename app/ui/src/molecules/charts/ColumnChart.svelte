<script lang="ts">
	import type { ColumnChartColumn } from './columnChart';

	type ColumnChartProps = {
		/** Le nom du graphique, lu par les lecteurs d'écran. */
		label: string;
		columns: ColumnChartColumn[];
		/** Rappelé à côté de la plus haute graduation (« visites »). */
		unitLabel?: string;
	};

	let { label, columns, unitLabel }: ColumnChartProps = $props();

	let activeColumnIndex: number | undefined = $state();

	const highestValue = $derived(Math.max(0, ...columns.map((column) => column.value)));
	const scaleMaximum = $derived(toRoundScaleMaximum(highestValue));
	const activeColumn = $derived(activeColumnIndex === undefined ? undefined : columns[activeColumnIndex]);

	// Une graduation ronde (5, 10, 20, 50…) au-dessus du plus haut : le haut du graphique se lit sans calcul.
	function toRoundScaleMaximum(value: number): number {
		if (value <= 4) return 4;
		const magnitude = 10 ** Math.floor(Math.log10(value));
		const roundSteps = [1, 2, 2.5, 5, 10];
		const step = roundSteps.find((roundStep) => roundStep * magnitude >= value) ?? 10;
		return step * magnitude;
	}

	function heightPercentOf(value: number): number {
		return scaleMaximum === 0 ? 0 : (value / scaleMaximum) * 100;
	}

	function moveActiveColumn(event: KeyboardEvent): void {
		const lastIndex = columns.length - 1;
		const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, Home: -columns.length, End: columns.length };
		const step = steps[event.key];
		if (step === undefined || lastIndex < 0) return;
		event.preventDefault();
		if (activeColumnIndex === undefined) activeColumnIndex = step > 0 ? 0 : lastIndex;
		else activeColumnIndex = Math.min(lastIndex, Math.max(0, activeColumnIndex + step));
	}

	// Près d'un bord, la bulle s'aligne sur lui au lieu de déborder du graphique.
	function bubbleAlignmentClass(columnIndex: number): string {
		const position = (columnIndex + 0.5) / columns.length;
		if (position < 0.15) return '-translate-x-4';
		if (position > 0.85) return '-translate-x-[calc(100%-1rem)]';
		return '-translate-x-1/2';
	}
</script>

<figure class="grid gap-2">
	<div class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
		<div aria-hidden="true" class="flex h-40 flex-col justify-between text-right text-label text-ink-subtle tabular-nums">
			<span>{scaleMaximum}{unitLabel ? ` ${unitLabel}` : ''}</span>
			<span>{scaleMaximum / 2}</span>
			<span>0</span>
		</div>

		<!-- Un seul arrêt au clavier pour tout le graphique, lu comme un curseur : les flèches passent d'une colonne à l'autre. -->
		<div
			role="slider"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={Math.max(0, columns.length - 1)}
			aria-valuenow={activeColumnIndex ?? columns.length - 1}
			aria-valuetext={activeColumn ? `${activeColumn.label} : ${activeColumn.valueLabel}` : 'Flèches gauche et droite pour lire chaque colonne'}
			tabindex="0"
			class="relative h-40 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
			onkeydown={moveActiveColumn}
			onblur={() => (activeColumnIndex = undefined)}
			onpointerleave={() => (activeColumnIndex = undefined)}
		>
			<div aria-hidden="true" class="pointer-events-none absolute inset-0 flex flex-col justify-between">
				<span class="border-t border-dashed border-line-soft"></span>
				<span class="border-t border-dashed border-line-soft"></span>
				<span class="border-t border-line"></span>
			</div>

			<div class="absolute inset-0 flex items-end gap-0.5">
				{#each columns as column, columnIndex (column.key)}
					<div
						role="presentation"
						class="flex h-full min-w-0 flex-1 cursor-default items-end rounded-t-xs {activeColumnIndex === columnIndex ? 'bg-surface-muted' : ''}"
						onpointerenter={() => (activeColumnIndex = columnIndex)}
					>
						<span
							class="block w-full rounded-t-xs {column.value === 0 ? 'h-0.5 bg-line-strong' : column.isEmphasized ? 'bg-accent' : 'bg-accent/40'}"
							style:height={column.value === 0 ? undefined : `${heightPercentOf(column.value)}%`}
						></span>
					</div>
				{/each}
			</div>

			{#if activeColumn && activeColumnIndex !== undefined}
				<div
					aria-hidden="true"
					class="pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-56 rounded-sm {bubbleAlignmentClass(activeColumnIndex)} bg-rail px-2.5 py-1.5 text-on-rail shadow-float"
					style:left="{((activeColumnIndex + 0.5) / columns.length) * 100}%"
				>
					<span class="block text-label text-rail-ink">{activeColumn.label}</span>
					<span class="block text-small font-semibold tabular-nums">{activeColumn.valueLabel}</span>
				</div>
			{/if}
		</div>

		<span></span>
		<div aria-hidden="true" class="flex gap-0.5 pt-1.5">
			{#each columns as column (column.key)}
				<span class="min-w-0 flex-1 overflow-visible text-center text-label whitespace-nowrap text-ink-subtle">{column.axisLabel ?? ''}</span>
			{/each}
		</div>
	</div>

	<table class="sr-only">
		<caption>{label}</caption>
		<tbody>
			{#each columns as column (column.key)}
				<tr><th scope="row">{column.label}</th><td>{column.valueLabel}</td></tr>
			{/each}
		</tbody>
	</table>
</figure>
