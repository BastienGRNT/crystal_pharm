<script lang="ts">
	import ProgressBar from '../atoms/ProgressBar.svelte';

	type CapacityGridProps = {
		filledCount: number;
		/** Les places promises, pas encore prises : dessinées en pointillés. */
		pendingCount: number;
		capacity: number;
		/** Ce que la grille dit en mots, pour qui ne la voit pas. */
		summary: string;
		surface?: 'rail' | 'page';
	};

	let { filledCount, pendingCount, capacity, summary, surface = 'page' }: CapacityGridProps = $props();

	// Au-delà, une case par place devient illisible : on retombe sur une barre.
	const largestCapacityDrawnAsPlaces = 60;

	type PlaceState = 'filled' | 'pending' | 'free';

	const places: PlaceState[] = $derived(
		Array.from({ length: Math.max(capacity, filledCount + pendingCount) }, (_, placeIndex): PlaceState => {
			if (placeIndex < filledCount) return 'filled';
			if (placeIndex < filledCount + pendingCount) return 'pending';
			return 'free';
		})
	);

	const placeClasses: Record<'rail' | 'page', Record<PlaceState, string>> = {
		rail: {
			filled: 'bg-accent-on-rail',
			pending: 'border-2 border-dashed border-accent-on-rail',
			free: 'bg-rail-raised'
		},
		page: {
			filled: 'bg-accent',
			pending: 'border-2 border-dashed border-accent',
			free: 'bg-surface-muted'
		}
	};
</script>

<!-- Une case par place : on voit d'un coup d'œil ce qui est pris, promis et libre ; ce qui déborde est cerclé. -->
{#if capacity <= largestCapacityDrawnAsPlaces}
	<ul role="img" aria-label={summary} class="flex flex-wrap gap-1.5">
		{#each places as placeState, placeIndex (placeIndex)}
			<li class="size-4 rounded-xs {placeClasses[surface][placeState]} {placeIndex >= capacity ? 'ring-2 ring-warning' : ''}"></li>
		{/each}
	</ul>
{:else}
	<ProgressBar label={summary} value={filledCount + pendingCount} maximum={capacity} />
{/if}
