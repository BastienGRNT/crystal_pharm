<script lang="ts">
	import type { Snippet } from 'svelte';

	type ToggleCardProps = {
		/** Le champ envoyé avec le formulaire quand la carte est cochée. */
		name: string;
		value: string;
		checked?: boolean;
		disabled?: boolean;
		/** Mise en avant (la carte vers laquelle on a été envoyé). */
		isHighlighted?: boolean;
		title: string;
		description: string;
		/** À droite du titre : un prix, un statut. */
		aside?: Snippet;
		/** Sous la description : un badge, une précision. */
		footer?: Snippet;
	};

	let {
		name,
		value,
		checked = $bindable(false),
		disabled = false,
		isHighlighted = false,
		title,
		description,
		aside,
		footer
	}: ToggleCardProps = $props();
</script>

<label
	class="flex gap-3 rounded-lg border bg-surface p-4 shadow-card transition-colors duration-[120ms] select-none has-[:checked]:border-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent {disabled
		? 'cursor-default'
		: 'cursor-pointer hover:border-line-strong'} {isHighlighted ? 'border-accent ring-2 ring-accent-soft' : 'border-line'}"
>
	<input type="checkbox" role="switch" {name} {value} {disabled} bind:checked class="peer sr-only" />
	<span
		aria-hidden="true"
		class="relative mt-0.5 h-5 w-9 flex-none rounded-full bg-line-strong transition-colors duration-[120ms] peer-checked:bg-accent peer-disabled:opacity-60 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-surface after:shadow-card after:transition-transform after:duration-[120ms] after:content-[''] peer-checked:after:translate-x-4"
	></span>
	<span class="grid min-w-0 flex-1 gap-1">
		<span class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
			<span class="body-strong text-ink">{title}</span>
			{@render aside?.()}
		</span>
		<span class="text-small text-ink-muted">{description}</span>
		{@render footer?.()}
	</span>
</label>
