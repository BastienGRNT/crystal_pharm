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
		children?: Snippet;
	};

	let { label, tone, timelinePosition, editHref, children }: ShiftChipProps = $props();

	const sharedClasses = $derived(`text-slot overflow-hidden rounded-xs px-2 whitespace-nowrap ${shiftChipToneClasses[tone]}`);
</script>

{#if timelinePosition}
	<div
		class="{sharedClasses} absolute inset-y-2.5 z-10 flex items-center"
		style:left="{timelinePosition.startPercent}%"
		style:width="{timelinePosition.widthPercent}%"
	>
		{@render children?.()}
		{#if editHref}
			<a href={editHref} class="min-w-0 flex-1 truncate focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Modifier le créneau {label}">{label}</a>
		{:else}
			{label}
		{/if}
	</div>
{:else}
	<div class="{sharedClasses} group relative mb-1 py-1">
		{#if editHref}
			<a href={editHref} class="block pr-6 focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Modifier le créneau {label}">{label}</a>
		{:else}
			{label}
		{/if}
		{@render children?.()}
	</div>
{/if}
