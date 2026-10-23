<script lang="ts">
	import type { Snippet } from 'svelte';
	import { shiftChipToneClasses, type ShiftChipTone } from './shiftChip';

	type ShiftChipProps = {
		label: string;
		tone: ShiftChipTone;
		/** Sur une frise horaire : la position du créneau, en pourcentage de la journée. */
		timelinePosition?: { startPercent: number; widthPercent: number };
		children?: Snippet;
	};

	let { label, tone, timelinePosition, children }: ShiftChipProps = $props();

	const sharedClasses = $derived(`text-slot overflow-hidden rounded-xs px-2 whitespace-nowrap ${shiftChipToneClasses[tone]}`);
</script>

{#if timelinePosition}
	<div
		class="{sharedClasses} absolute inset-y-2.5 z-10 flex items-center"
		style:left="{timelinePosition.startPercent}%"
		style:width="{timelinePosition.widthPercent}%"
	>
		{@render children?.()}{label}
	</div>
{:else}
	<div class="{sharedClasses} group relative mb-1 py-1">
		{label}
		{@render children?.()}
	</div>
{/if}
