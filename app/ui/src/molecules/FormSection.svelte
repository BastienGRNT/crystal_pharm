<script lang="ts">
	import type { Snippet } from 'svelte';

	type FormSectionProps = {
		title: string;
		/** Une phrase : ce qu'on attend ici. */
		description?: string;
		/** L'ordre de remplissage, quand le formulaire se lit en étapes. */
		stepNumber?: number;
		/** `aside` : le titre à gauche, les champs à droite (une page) ; `stacked` : l'un sous l'autre (un panneau). */
		layout?: 'aside' | 'stacked';
		/** Un lien ou un bouton à droite du titre. */
		headerAction?: Snippet;
		children: Snippet;
	};

	let { title, description, stepNumber, layout = 'aside', headerAction, children }: FormSectionProps = $props();

	const componentId = $props.id();
	const titleId = `form-section-title-${componentId}`;
</script>

<section
	aria-labelledby={titleId}
	class="grid gap-x-10 gap-y-3 {layout === 'aside' ? 'lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]' : ''}"
>
	<div class="flex items-start gap-3 {layout === 'aside' ? 'lg:pt-1' : ''}">
		{#if stepNumber !== undefined}
			<span
				aria-hidden="true"
				class="grid size-8 flex-none place-items-center rounded-full border-2 border-accent font-display text-[16px] leading-none text-accent-text"
			>
				{stepNumber}
			</span>
		{/if}
		<div class="grid min-w-0 flex-1 gap-1">
			<div class="flex items-baseline justify-between gap-3">
				<h2 id={titleId} class="font-display text-[21px] leading-7 text-ink">{title}</h2>
				{#if headerAction}<div class="flex-none">{@render headerAction()}</div>{/if}
			</div>
			{#if description}<p class="text-small text-ink-muted">{description}</p>{/if}
		</div>
	</div>
	<div class="grid min-w-0 content-start gap-4 {layout === 'aside' ? 'rounded-xl border border-line bg-surface p-6 shadow-card max-sm:p-4' : ''}">
		{@render children()}
	</div>
</section>
