<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';

	type SidePanelProps = {
		title: string;
		/** Le lien qui ferme le panneau : l'URL de la page sans le panneau. */
		closeHref: string;
		children: Snippet;
	};

	let { title, closeHref, children }: SidePanelProps = $props();

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

<div class="fixed inset-0 z-10 flex justify-end">
	<a href={closeHref} aria-hidden="true" tabindex="-1" class="absolute inset-0 bg-ink/30"></a>

	<div
		bind:this={panelElement}
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		tabindex="-1"
		class="relative flex h-full w-full max-w-[400px] flex-col border-l border-line bg-surface shadow-float outline-none"
	>
		<header class="flex h-topbar flex-none items-center justify-between border-b border-line px-5">
			<h2 id={titleId} class="title-2 text-ink">{title}</h2>
			<a
				bind:this={closeLinkElement}
				href={closeHref}
				aria-label="Fermer"
				class="grid size-8 place-items-center rounded-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
			>
				<Icon name="x" size={18} />
			</a>
		</header>
		<div class="flex-1 overflow-auto p-5">
			{@render children()}
		</div>
	</div>
</div>
