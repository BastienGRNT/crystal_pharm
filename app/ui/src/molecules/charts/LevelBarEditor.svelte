<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '../../atoms/actions/Button.svelte';
	import { groupLevelBarEditorSegments, listLevelTicks, type LevelBarEditorColumn } from './levelBarEditor';

	type LevelBarEditorProps = {
		/** Le nom du graphique, lu par les lecteurs d'écran. */
		label: string;
		columns: LevelBarEditorColumn[];
		/** Le plancher : aucune colonne ne descend en dessous, une ligne le rappelle. */
		minimum: number;
		maximum: number;
		/** Écrit sur la ligne du plancher (« En permanence : 2 »). */
		minimumLabel: string;
		/** Une valeur à ne pas dépasser sans le savoir : au-dessus, les barres changent de couleur. */
		reference?: { value: number; label: string };
		/** La valeur en mots (« 3 personnes »). */
		formatValue: (value: number) => string;
		/** Écrit dans une suite de colonnes désactivées (« Fermé »). */
		disabledLabel?: string;
		/** Ajoute `difference` à chaque colonne active entre `firstIndex` et `lastIndex`, bornes comprises. */
		onadjust: (firstIndex: number, lastIndex: number, difference: number) => void;
		/** Des actions de plus, au bout de la barre d'outils. */
		toolbarEnd?: Snippet;
	};

	let { label, columns, minimum, maximum, minimumLabel, reference, formatValue, disabledLabel, onadjust, toolbarEnd }: LevelBarEditorProps =
		$props();

	let anchorIndex: number | undefined = $state();
	let focusIndex: number | undefined = $state();
	let isDragging = $state(false);
	const columnButtons: HTMLButtonElement[] = $state([]);

	const segments = $derived(groupLevelBarEditorSegments(columns));
	const enabledIndexes = $derived(columns.flatMap((column, columnIndex) => (column.isDisabled ? [] : [columnIndex])));
	const highestValue = $derived(Math.max(minimum, ...columns.map((column) => column.value)));
	const scaleMaximum = $derived(Math.max(minimum + 4, highestValue + 1, (reference?.value ?? 0) + 1));
	const ticks = $derived(listLevelTicks(scaleMaximum));

	const selection = $derived.by(() => {
		if (anchorIndex === undefined || focusIndex === undefined) return undefined;
		const firstIndex = Math.min(anchorIndex, focusIndex);
		const lastIndex = Math.max(anchorIndex, focusIndex);
		const selectedIndexes = enabledIndexes.filter((columnIndex) => firstIndex <= columnIndex && columnIndex <= lastIndex);
		const firstColumn = columns[selectedIndexes[0] ?? -1];
		const lastColumn = columns[selectedIndexes.at(-1) ?? -1];
		if (!firstColumn || !lastColumn) return undefined;
		const values = selectedIndexes.map((columnIndex) => columns[columnIndex]?.value ?? minimum);
		return {
			firstIndex,
			lastIndex,
			rangeLabel: `${firstColumn.startLabel} – ${lastColumn.endLabel}`,
			lowestValue: Math.min(...values),
			highestValue: Math.max(...values)
		};
	});
	const tabStopIndex = $derived(focusIndex ?? enabledIndexes[0]);

	function heightPercentOf(value: number): number {
		return (value / scaleMaximum) * 100;
	}

	function isSelected(columnIndex: number): boolean {
		return selection !== undefined && selection.firstIndex <= columnIndex && columnIndex <= selection.lastIndex;
	}

	// Une étiquette au début de chaque palier au-dessus du plancher, pas sur chaque barre.
	function startsLevel(columnIndex: number): boolean {
		const column = columns[columnIndex];
		const previousColumn = columns[columnIndex - 1];
		if (!column || column.value <= minimum) return false;
		return !previousColumn || previousColumn.isDisabled === true || previousColumn.value !== column.value;
	}

	function adjustSelection(difference: number): void {
		if (selection) onadjust(selection.firstIndex, selection.lastIndex, difference);
	}

	function startSelecting(event: PointerEvent, columnIndex: number): void {
		if (event.button !== 0) return;
		if (event.shiftKey && anchorIndex !== undefined) focusIndex = columnIndex;
		else anchorIndex = focusIndex = columnIndex;
		isDragging = true;
		// Au doigt, le navigateur garde le pointeur sur la première barre : on le relâche pour suivre le glissé.
		const columnButton = event.currentTarget as HTMLElement;
		if (columnButton.hasPointerCapture(event.pointerId)) columnButton.releasePointerCapture(event.pointerId);
	}

	function extendSelection(columnIndex: number): void {
		if (isDragging) focusIndex = columnIndex;
	}

	function selectWithKeyboard(event: MouseEvent, columnIndex: number): void {
		if (event.detail === 0) anchorIndex = focusIndex = columnIndex;
	}

	function moveFocus(columnIndex: number | undefined, isExtending: boolean): void {
		if (columnIndex === undefined) return;
		if (!isExtending || anchorIndex === undefined) anchorIndex = columnIndex;
		focusIndex = columnIndex;
		columnButtons[columnIndex]?.focus();
	}

	function handleKeys(event: KeyboardEvent): void {
		const currentIndex = focusIndex ?? enabledIndexes[0];
		if (currentIndex === undefined) return;
		const nextIndex = enabledIndexes.find((columnIndex) => columnIndex > currentIndex);
		const previousIndex = enabledIndexes.findLast((columnIndex) => columnIndex < currentIndex);
		const keyActions: Record<string, () => void> = {
			ArrowRight: () => moveFocus(nextIndex ?? currentIndex, event.shiftKey),
			ArrowLeft: () => moveFocus(previousIndex ?? currentIndex, event.shiftKey),
			Home: () => moveFocus(enabledIndexes[0], event.shiftKey),
			End: () => moveFocus(enabledIndexes.at(-1), event.shiftKey),
			ArrowUp: () => adjustSelection(1),
			'+': () => adjustSelection(1),
			ArrowDown: () => adjustSelection(-1),
			'-': () => adjustSelection(-1),
			Escape: () => (anchorIndex = focusIndex = undefined)
		};
		const keyAction = keyActions[event.key];
		if (!keyAction) return;
		event.preventDefault();
		// La première flèche choisit la barre qui a le focus, sans la sauter.
		if (focusIndex === undefined) {
			anchorIndex = focusIndex = currentIndex;
			if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') return;
		}
		keyAction();
	}

	function describeSelectedValues(lowestValue: number, highestValue: number): string {
		return lowestValue === highestValue ? formatValue(lowestValue) : `de ${lowestValue} à ${formatValue(highestValue)}`;
	}
</script>

<svelte:window onpointerup={() => (isDragging = false)} onpointercancel={() => (isDragging = false)} />

<div class="grid gap-3">
	<div class="flex min-h-control flex-wrap items-center gap-x-4 gap-y-2">
		{#if selection}
			<div class="flex items-center gap-2">
				<Button variant="secondary" icon="minus" disabled={selection.highestValue <= minimum} onclick={() => adjustSelection(-1)}>
					<span class="sr-only">Une de moins</span>
				</Button>
				<span class="min-w-10 text-center text-kpi text-ink tabular-nums">
					{selection.lowestValue === selection.highestValue ? selection.lowestValue : `${selection.lowestValue}–${selection.highestValue}`}
				</span>
				<Button variant="secondary" icon="plus" disabled={selection.lowestValue >= maximum} onclick={() => adjustSelection(1)}>
					<span class="sr-only">Une de plus</span>
				</Button>
			</div>
			<p aria-live="polite" class="min-w-0">
				<span class="block body-strong text-ink tabular-nums">{selection.rangeLabel}</span>
				<span class="block text-small text-ink-muted">{describeSelectedValues(selection.lowestValue, selection.highestValue)}</span>
			</p>
		{:else}
			<p class="text-small text-ink-muted">Cliquez sur une barre, ou glissez sur plusieurs, puis ajustez avec + et −.</p>
		{/if}
		{#if toolbarEnd}<div class="ml-auto flex flex-wrap items-center gap-2">{@render toolbarEnd()}</div>{/if}
	</div>

	<div class="overflow-x-auto pb-1">
		<div class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2" style:min-width="{columns.length * 18 + 32}px">
			<div aria-hidden="true" class="relative h-52 w-6 text-right text-label text-ink-subtle tabular-nums sm:h-60">
				{#each ticks as tick (tick)}
					<span class="absolute right-0 translate-y-1/2" style:bottom="{heightPercentOf(tick)}%">{tick}</span>
				{/each}
			</div>

			<div class="relative h-52 sm:h-60">
				<div aria-hidden="true" class="pointer-events-none absolute inset-0">
					{#each ticks as tick (tick)}
						<span class="absolute inset-x-0 border-t {tick === 0 ? 'border-line' : 'border-line-soft'}" style:bottom="{heightPercentOf(tick)}%"></span>
					{/each}
				</div>

				<div
					role="group"
					aria-label="{label} — flèches pour choisir, Maj pour étendre, haut et bas pour ajuster"
					class="absolute inset-0 flex items-stretch gap-0.5 touch-pan-y select-none"
				>
					{#each segments as segment (segment.kind === 'gap' ? segment.key : columns[segment.columnIndex]?.key)}
						{#if segment.kind === 'gap'}
							<div
								class="grid min-w-0 place-items-center rounded-xs border border-dashed border-line bg-surface-muted/70"
								style:flex-grow={segment.columnCount}
								style:flex-basis="0"
							>
								{#if disabledLabel}
									<span class="text-label text-ink-subtle {segment.columnCount < 3 ? '[writing-mode:vertical-rl]' : ''}">{disabledLabel}</span>
								{/if}
							</div>
						{:else}
							{@const columnIndex = segment.columnIndex}
							{@const column = columns[columnIndex]}
							{#if column}
								{@const isAboveReference = reference !== undefined && column.value > reference.value}
								<button
									bind:this={columnButtons[columnIndex]}
									type="button"
									tabindex={tabStopIndex === columnIndex ? 0 : -1}
									aria-pressed={isSelected(columnIndex)}
									aria-label="{column.startLabel} – {column.endLabel} : {formatValue(column.value)}"
									class="group relative flex min-w-0 flex-1 basis-0 cursor-pointer flex-col justify-end rounded-t-xs outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-focus-ring aria-pressed:bg-accent-soft"
									onpointerdown={(event) => startSelecting(event, columnIndex)}
									onpointerenter={() => extendSelection(columnIndex)}
									onclick={(event) => selectWithKeyboard(event, columnIndex)}
									onkeydown={handleKeys}
								>
									{#if startsLevel(columnIndex)}
										<span
											aria-hidden="true"
											class="pointer-events-none absolute left-0 z-10 text-label font-bold whitespace-nowrap tabular-nums {isAboveReference ? 'text-warning' : 'text-accent-text'}"
											style:bottom="calc({heightPercentOf(column.value)}% + 2px)"
										>
											{column.value}
										</span>
									{/if}
									<span class="flex flex-col overflow-hidden rounded-t-xs transition-[height] duration-150" style:height="{heightPercentOf(column.value)}%">
										<span class="{isAboveReference ? 'bg-warning' : 'bg-accent'} group-aria-pressed:brightness-95" style:flex-grow={column.value - minimum}></span>
										<span class="bg-accent/30" style:flex-grow={Math.min(column.value, minimum)}></span>
									</span>
								</button>
							{/if}
						{/if}
					{/each}
				</div>

				<div aria-hidden="true" class="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-ink-subtle" style:bottom="{heightPercentOf(minimum)}%">
					<span class="absolute bottom-0.5 left-1 rounded-xs bg-surface/90 px-1 text-label font-semibold text-ink-muted">{minimumLabel}</span>
				</div>
				{#if reference}
					<div aria-hidden="true" class="pointer-events-none absolute inset-x-0 border-t border-dashed border-warning" style:bottom="{heightPercentOf(reference.value)}%">
						<span class="absolute right-1 bottom-0.5 rounded-xs bg-surface/90 px-1 text-label font-semibold text-warning">{reference.label}</span>
					</div>
				{/if}
			</div>

			<span></span>
			<div aria-hidden="true" class="flex gap-0.5 pt-1.5">
				{#each segments as segment (segment.kind === 'gap' ? segment.key : columns[segment.columnIndex]?.key)}
					<span
						class="min-w-0 basis-0 overflow-visible text-left text-label whitespace-nowrap text-ink-subtle"
						style:flex-grow={segment.kind === 'gap' ? segment.columnCount : 1}
					>
						{segment.kind === 'column' ? (columns[segment.columnIndex]?.axisLabel ?? '') : ''}
					</span>
				{/each}
			</div>
		</div>
	</div>
</div>
