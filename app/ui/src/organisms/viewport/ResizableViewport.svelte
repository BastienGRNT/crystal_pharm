<script lang="ts">
	import type { Snippet } from 'svelte';
	import IconButton from '../../atoms/actions/IconButton.svelte';
	import ResizeHandle from '../../atoms/actions/ResizeHandle.svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
	import { viewportZoomSteps, zoomInFrom, zoomOutFrom, type ViewportPreset, type ViewportZoom } from './resizableViewport';

	type ResizableViewportProps = {
		label: string;
		presets: ViewportPreset[];
		/** La largeur simulée, en pixels CSS, comme celle d'une fenêtre de navigateur. */
		width: number;
		zoom: ViewportZoom;
		minimumWidth?: number;
		maximumWidth?: number;
		/** Ce qui s'affiche dans la fenêtre simulée (une iframe, le plus souvent). */
		children: Snippet;
		/** Des actions en plus, au bout de la barre (recharger, ouvrir…). */
		toolbarEnd?: Snippet;
		/** Sans barre : la page qui l'affiche pose elle-même les largeurs (dans un îlot flottant, par exemple). */
		showsToolbar?: boolean;
	};

	let {
		label,
		presets,
		width = $bindable(),
		zoom = $bindable('fit'),
		minimumWidth = 320,
		maximumWidth = 1920,
		children,
		toolbarEnd,
		showsToolbar = true
	}: ResizableViewportProps = $props();

	// L'espace autour de la fenêtre : la marge de la scène (p-6) et les deux poignées avec leur écart (w-3 + gap-2).
	const horizontalFramingInPixels = 2 * 24 + 2 * (12 + 8);
	const verticalFramingInPixels = 2 * 24;
	const smallestFrameHeightInPixels = 320;

	let stageWidth = $state(0);
	let stageHeight = $state(0);
	let isResizing = $state(false);
	let stage: HTMLElement | undefined = $state();

	const smallestZoom = viewportZoomSteps[0] ?? 0.25;
	const fittingZoom = $derived(
		stageWidth === 0 ? 1 : Math.max(smallestZoom, Math.min(1, (stageWidth - horizontalFramingInPixels) / width))
	);
	const shownZoom = $derived(zoom === 'fit' ? fittingZoom : zoom);
	const frameHeight = $derived(Math.max(smallestFrameHeightInPixels, (stageHeight - verticalFramingInPixels) / shownZoom));

	function setWidth(newWidth: number): void {
		width = Math.round(Math.min(maximumWidth, Math.max(minimumWidth, newWidth)));
	}

	// En glissant, le zoom se fige : la poignée reste sous la souris, et la fenêtre peut dépasser la scène (elle défile alors).
	function startResizing(): void {
		if (zoom === 'fit') zoom = fittingZoom;
		isResizing = true;
	}

	// La fenêtre est centrée : chaque bord bouge de la moitié de l'élargissement.
	function resizeFromEdge(edge: 'left' | 'right', deltaInPixels: number): void {
		const direction = edge === 'right' ? 1 : -1;
		setWidth(width + (2 * direction * deltaInPixels) / shownZoom);
	}

	function choosePreset(preset: ViewportPreset): void {
		width = preset.width;
		zoom = 'fit';
	}

	// Ctrl + molette zoome l'aperçu, comme le zoom du navigateur zoome la page.
	$effect(() => {
		if (!stage) return;
		const zoomedStage = stage;
		function zoomWithWheel(event: WheelEvent): void {
			if (!event.ctrlKey && !event.metaKey) return;
			event.preventDefault();
			zoom = event.deltaY < 0 ? zoomInFrom(shownZoom) : zoomOutFrom(shownZoom);
		}
		zoomedStage.addEventListener('wheel', zoomWithWheel, { passive: false });
		return () => zoomedStage.removeEventListener('wheel', zoomWithWheel);
	});
</script>

<section aria-label={label} class="flex size-full min-h-0 flex-col bg-surface-muted">
	<div class="flex flex-wrap {showsToolbar ? '' : 'hidden'} items-center gap-x-3 gap-y-2 border-b border-line bg-surface px-3 py-2">
		<div role="group" aria-label="Largeur de l’écran" class="inline-flex items-center gap-0.5 rounded-control border border-line bg-surface-muted p-[3px]">
			{#each presets as preset (preset.width)}
				<button
					type="button"
					aria-pressed={width === preset.width}
					title="{preset.label} · {preset.width} px"
					class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm px-2.5 text-small font-semibold text-ink-muted hover:text-ink aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-card"
					onclick={() => choosePreset(preset)}
				>
					<Icon name={preset.icon} size={16} />
					<span class="max-xl:sr-only">{preset.label}</span>
				</button>
			{/each}
		</div>
		<span class="text-small text-ink-muted tabular-nums" aria-live="polite">{width} px</span>

		<div role="group" aria-label="Zoom" class="ml-auto inline-flex items-center gap-0.5">
			<IconButton icon="magnifying-glass-minus" label="Dézoomer" onclick={() => (zoom = zoomOutFrom(shownZoom))} />
			<button
				type="button"
				title="Revenir à 100 %"
				class="h-8 min-w-14 cursor-pointer rounded-sm px-1.5 text-small font-semibold text-ink tabular-nums hover:bg-surface-muted"
				onclick={() => (zoom = 1)}
			>
				{Math.round(shownZoom * 100)} %
			</button>
			<IconButton icon="magnifying-glass-plus" label="Zoomer" onclick={() => (zoom = zoomInFrom(shownZoom))} />
			<button
				type="button"
				aria-pressed={zoom === 'fit'}
				class="ml-1 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-line px-2.5 text-small font-semibold text-ink-muted hover:text-ink aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-text"
				onclick={() => (zoom = 'fit')}
			>
				<Icon name="frame-corners" size={16} />
				Ajuster
			</button>
		</div>
		{#if toolbarEnd}{@render toolbarEnd()}{/if}
	</div>

	<div bind:this={stage} bind:clientWidth={stageWidth} bind:clientHeight={stageHeight} class="relative min-h-0 flex-1 overflow-auto">
		<div class="flex w-max min-w-full items-center justify-center gap-2 p-6">
			<ResizeHandle
				label="Élargir ou rétrécir l’écran"
				value={width}
				minimum={minimumWidth}
				maximum={maximumWidth}
				onmove={(deltaInPixels) => resizeFromEdge('left', deltaInPixels)}
				onresizestart={startResizing}
				onresizeend={() => (isResizing = false)}
				onreset={() => (zoom = 'fit')}
			/>
			<div
				class="relative flex-none overflow-hidden rounded-md border border-line bg-surface shadow-float"
				style:width="{width * shownZoom}px"
				style:height="{frameHeight * shownZoom}px"
			>
				<div class="origin-top-left" style:width="{width}px" style:height="{frameHeight}px" style:transform="scale({shownZoom})">
					{@render children()}
				</div>
			</div>
			<ResizeHandle
				label="Élargir ou rétrécir l’écran"
				value={width}
				minimum={minimumWidth}
				maximum={maximumWidth}
				onmove={(deltaInPixels) => resizeFromEdge('right', deltaInPixels)}
				onresizestart={startResizing}
				onresizeend={() => (isResizing = false)}
				onreset={() => (zoom = 'fit')}
			/>
		</div>
	</div>
</section>

<!-- Pendant qu'on glisse, l'iframe ne doit pas capter la souris : un voile la couvre. -->
{#if isResizing}
	<div aria-hidden="true" class="fixed inset-0 z-50 cursor-col-resize"></div>
{/if}
