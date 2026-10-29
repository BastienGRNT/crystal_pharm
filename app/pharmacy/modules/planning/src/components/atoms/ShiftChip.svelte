<script lang="ts">
	import type { Snippet } from 'svelte';
	import { shiftChipToneClasses, type ShiftChipTone } from './shiftChip';

	type ShiftChipProps = {
		label: string;
		tone: ShiftChipTone;
		/** Sur une frise horaire : la position du créneau, en pourcentage de la journée. */
		timelinePosition?: { startPercent: number; widthPercent: number };
		/** Fait du créneau un lien, vers sa modification. */
		editHref?: string;
		/** Rend le créneau déplaçable à la souris ou au doigt. */
		onDragStart?: (event: PointerEvent) => void;
		/** Sur une frise : poignées aux deux bords pour changer l'heure de début ou de fin. */
		onResizeStart?: (edge: 'start' | 'end', event: PointerEvent) => void;
		/** Pendant un glissement : le créneau suit le pointeur, par-dessus le reste. */
		dragOffset?: { x: number; y: number };
		isDragged?: boolean;
		children?: Snippet;
	};

	let { label, tone, timelinePosition, editHref, onDragStart, onResizeStart, dragOffset, isDragged = false, children }: ShiftChipProps = $props();

	const sharedClasses = $derived(
		`text-slot overflow-hidden rounded-xs px-2 whitespace-nowrap ${shiftChipToneClasses[tone]} ${onDragStart ? 'cursor-grab touch-none select-none' : ''} ${isDragged ? 'cursor-grabbing opacity-80 shadow-card' : ''}`
	);
	const resizeHandleClasses = 'absolute inset-y-0 z-20 w-2 cursor-ew-resize touch-none';
</script>

{#if timelinePosition}
	<div
		role="group"
		aria-label={label}
		class="{sharedClasses} absolute inset-y-2.5 z-10 flex items-center {isDragged ? 'z-30' : ''}"
		style:left="{timelinePosition.startPercent}%"
		style:width="{timelinePosition.widthPercent}%"
		onpointerdown={onDragStart}
	>
		{#if onResizeStart}
			<span aria-hidden="true" class="{resizeHandleClasses} left-0" onpointerdown={(event) => { event.stopPropagation(); onResizeStart('start', event); }}></span>
		{/if}
		{@render children?.()}
		{#if editHref}
			<a href={editHref} draggable="false" class="min-w-0 flex-1 truncate focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Modifier le créneau {label}">{label}</a>
		{:else}
			{label}
		{/if}
		{#if onResizeStart}
			<span aria-hidden="true" class="{resizeHandleClasses} right-0" onpointerdown={(event) => { event.stopPropagation(); onResizeStart('end', event); }}></span>
		{/if}
	</div>
{:else}
	<div
		role="group"
		aria-label={label}
		class="{sharedClasses} group relative mb-1 py-1 {isDragged ? 'z-30' : ''}"
		style:transform={dragOffset ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined}
		onpointerdown={onDragStart}
	>
		{#if editHref}
			<a href={editHref} draggable="false" class="block pr-6 focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Modifier le créneau {label}">{label}</a>
		{:else}
			{label}
		{/if}
		{@render children?.()}
	</div>
{/if}
