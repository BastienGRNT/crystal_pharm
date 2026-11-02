<script lang="ts">
	import type { Snippet } from 'svelte';

	type FloatingIslandProps = {
		label: string;
		/** Le nom de la feuille dépliée, lu par les lecteurs d'écran. */
		sheetLabel: string;
		isExpanded: boolean;
		/** La pastille, toujours visible : les quelques actions qu'on garde sous la main. */
		bar: Snippet;
		/**
		 * Ce que l'îlot montre une fois déplié, au-dessus de la pastille. Toujours monté, seulement caché :
		 * les champs qu'il contient partent avec le formulaire. Il fait défiler son contenu lui-même
		 * (un `min-h-0 overflow-y-auto`), pour pouvoir le ramener en haut.
		 */
		sheet: Snippet;
	};

	let { label, sheetLabel, isExpanded = $bindable(false), bar, sheet }: FloatingIslandProps = $props();

	const componentId = $props.id();
	const sheetId = `floating-island-sheet-${componentId}`;

	function collapseOnEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape' && isExpanded) isExpanded = false;
	}
</script>

<svelte:window onkeydown={collapseOnEscape} />

<!-- Seul l'îlot capte la souris : autour, la page en dessous reste cliquable. -->
<div class="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
	<section
		aria-label={label}
		data-expanded={isExpanded ? 'true' : undefined}
		class="pointer-events-auto flex max-w-full flex-col overflow-hidden rounded-full border border-line/70 bg-surface/75 text-ink shadow-float backdrop-blur-xl backdrop-saturate-150 data-[expanded=true]:w-[min(560px,100%)] data-[expanded=true]:rounded-xl"
	>
		<div id={sheetId} role="region" aria-label={sheetLabel} hidden={!isExpanded} class="animate-island-in border-b border-line/70">
			<div class="flex max-h-[min(70vh,680px)] min-h-0 flex-col">
				{@render sheet()}
			</div>
		</div>
		<div class="flex items-center gap-1 p-2">
			{@render bar()}
		</div>
	</section>
</div>
