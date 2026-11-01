<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type UnitInputProps = HTMLInputAttributes & {
		/** L'unité affichée à droite de la saisie (« % », « € / mois »). */
		unit: string;
	};

	let { value = $bindable(), unit, class: className = '', ...inputAttributes }: UnitInputProps = $props();
</script>

<div
	class="flex h-control w-full items-center rounded-sm border border-line-strong bg-surface transition-[border-color,box-shadow] duration-[120ms] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft-value)] has-[[aria-invalid=true]]:border-danger {className}"
>
	<!-- Sans largeur de départ, la saisie garde ses ~150 px par défaut et pousse l’unité hors d’une colonne étroite. -->
	<input
		bind:value
		{...inputAttributes}
		class="h-full w-0 min-w-0 flex-1 rounded-sm bg-transparent px-2.5 text-right text-[14px] leading-5 text-ink tabular-nums placeholder:text-ink-subtle focus-visible:outline-none"
	/>
	<span class="flex-none pr-2.5 text-small text-ink-muted">{unit}</span>
</div>
