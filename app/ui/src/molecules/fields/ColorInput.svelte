<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type ColorInputProps = Omit<HTMLInputAttributes, 'type' | 'value'> & {
		/** Au format #rrggbb, le seul que comprend le sélecteur de couleur du navigateur. */
		value?: string;
	};

	let { value = $bindable(''), class: className = '', ...inputAttributes }: ColorInputProps = $props();

	const isPickableColor = $derived(/^#[0-9a-fA-F]{6}$/.test(value));
</script>

<div
	class="flex h-control w-full items-center gap-2 rounded-sm border border-line-strong bg-surface pl-1.5 transition-[border-color,box-shadow] duration-[120ms] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft-value)] has-[[aria-invalid=true]]:border-danger {className}"
>
	<!-- La saisie au clavier porte le nom du champ : le sélecteur ne fait que la remplir. -->
	<input
		type="color"
		tabindex="-1"
		aria-hidden="true"
		value={isPickableColor ? value : '#000000'}
		oninput={(event) => (value = event.currentTarget.value)}
		class="h-6 w-8 flex-none cursor-pointer rounded-sm border border-line bg-transparent p-0"
	/>
	<input
		bind:value
		{...inputAttributes}
		type="text"
		maxlength={7}
		spellcheck="false"
		autocomplete="off"
		class="h-full min-w-0 flex-1 rounded-sm bg-transparent pr-2.5 text-[14px] leading-5 text-ink uppercase tabular-nums placeholder:text-ink-subtle focus-visible:outline-none"
	/>
</div>
