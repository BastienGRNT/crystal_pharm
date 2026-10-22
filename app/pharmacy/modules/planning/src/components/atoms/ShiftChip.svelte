<script lang="ts">
	import type { Snippet } from 'svelte';

	type ShiftChipProps = {
		label: string;
		/** Sur une frise horaire : la position du créneau, en pourcentage de la journée. */
		timelinePosition?: { startPercent: number; widthPercent: number };
		children?: Snippet;
	};

	let { label, timelinePosition, children }: ShiftChipProps = $props();

	const sharedClasses =
		'text-slot overflow-hidden rounded-xs bg-accent-soft px-2 whitespace-nowrap text-ink shadow-[inset_2px_0_0_var(--accent-value)]';
</script>

{#if timelinePosition}
	<div
		class="{sharedClasses} absolute inset-y-2.5 flex items-center"
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
