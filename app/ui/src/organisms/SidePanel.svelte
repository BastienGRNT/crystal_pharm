<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';

	type SidePanelProps = {
		title: string;
		/** Le lien qui ferme le panneau : l'URL de la page sans le panneau. */
		closeHref: string;
		/** `wide` : quand le panneau montre un document à lire, pas seulement un formulaire. */
		size?: 'regular' | 'wide';
		children: Snippet;
	};

	let { title, closeHref, size = 'regular', children }: SidePanelProps = $props();

	const widthClasses = { regular: 'max-w-[460px]', wide: 'max-w-[680px]' };

	const componentId = $props.id();
	const titleId = `side-panel-title-${componentId}`;
	let panelElement: HTMLElement | undefined = $state();
	let closeLinkElement: HTMLAnchorElement | undefined = $state();

	$effect(() => {
		panelElement?.focus();
	});

	// Échap passe par le lien de fermeture, pour que la navigation reste celle de l'app.
	function closeOnEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape') closeLinkElement?.click();
	}
</script>

<svelte:window onkeydown={closeOnEscape} />

<div class="fixed inset-0 z-40 flex justify-end">
	<a href={closeHref} aria-hidden="true" tabindex="-1" class="absolute inset-0 animate-veil-in bg-rail/45 backdrop-blur-[2px]"></a>

	<div
		bind:this={panelElement}
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		tabindex="-1"
		class="relative flex h-full w-full {widthClasses[size]} animate-drawer-in flex-col bg-app shadow-float outline-none sm:my-2 sm:mr-2 sm:h-[calc(100%-16px)] sm:rounded-xl sm:border sm:border-line"
	>
		<header class="flex flex-none items-center justify-between gap-3 border-b border-line px-6 pt-5 pb-4 max-sm:px-4">
			<h2 id={titleId} class="font-display text-[24px] leading-8 text-ink">{title}</h2>
			<a
				bind:this={closeLinkElement}
				href={closeHref}
				aria-label="Fermer"
				class="grid size-10 flex-none place-items-center rounded-full border border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
			>
				<Icon name="x" size={18} />
			</a>
		</header>
		<div class="flex-1 overflow-auto px-6 py-5 max-sm:px-4">
			{@render children()}
		</div>
	</div>
</div>
