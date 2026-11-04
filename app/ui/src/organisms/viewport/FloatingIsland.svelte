<script lang="ts">
	import type { Snippet } from 'svelte';

	type FloatingIslandProps = {
		label: string;
		/** Le nom de la feuille dépliée, lu par les lecteurs d'écran. */
		sheetLabel: string;
		isExpanded: boolean;
		/** La colonne d'icônes, toujours visible : les quelques actions qu'on garde sous la main. */
		bar: Snippet;
		/**
		 * Ce que l'îlot montre une fois déplié, à droite de la colonne. Toujours monté, seulement caché :
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
<div class="pointer-events-none fixed inset-y-0 left-0 z-40 flex max-w-full items-center p-3">
	<section
		aria-label={label}
		data-expanded={isExpanded ? 'true' : undefined}
		class="pointer-events-auto flex max-h-full min-h-0 overflow-hidden rounded-full border border-line/70 bg-surface/75 text-ink shadow-float backdrop-blur-xl backdrop-saturate-150 data-[expanded=true]:h-full data-[expanded=true]:rounded-xl"
	>
		<div class="flex flex-none flex-col items-center gap-1 overflow-y-auto p-2 [scrollbar-width:none]">
			{@render bar()}
		</div>
		<div
			id={sheetId}
			role="region"
			aria-label={sheetLabel}
			hidden={!isExpanded}
			class="w-[min(460px,calc(100vw-96px))] animate-island-in border-l border-line/70"
		>
			<div class="flex h-full min-h-0 flex-col">
				{@render sheet()}
			</div>
		</div>
	</section>
</div>
