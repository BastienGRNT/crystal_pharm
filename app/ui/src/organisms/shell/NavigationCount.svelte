<script lang="ts">
	type NavigationCountProps = {
		/** Ce qui attend dans la page : un nombre se lit mieux qu'un point. */
		count?: number;
		needsAttention?: boolean;
		/** `corner` : posé sur une icône, dans la barre d'onglets du mobile. */
		placement?: 'inline' | 'corner';
	};

	let { count, needsAttention = false, placement = 'inline' }: NavigationCountProps = $props();

	const placementClasses = {
		inline: '',
		corner: 'absolute top-1.5 left-[calc(50%+6px)] ring-2 ring-rail'
	};
</script>

{#if count && count > 0}
	<span
		class="inline-grid h-5 min-w-5 place-items-center rounded-full bg-notify px-1.5 text-[12px] leading-none font-bold text-white tabular-nums {placementClasses[
			placement
		]}"
	>
		{count > 99 ? '99+' : count}
		<span class="sr-only">à traiter</span>
	</span>
{:else if needsAttention}
	<span aria-hidden="true" class="size-2 rounded-full bg-notify {placementClasses[placement]}"></span>
	<span class="sr-only">, à compléter</span>
{/if}
