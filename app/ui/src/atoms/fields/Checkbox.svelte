<script lang="ts">
	import type { Snippet } from 'svelte';

	type CheckboxProps = {
		name: string;
		value?: string;
		checked?: boolean;
		/** Le formulaire ne part pas tant que la case n'est pas cochée. */
		required?: boolean;
		/** Le texte à côté de la case : il peut contenir des liens. */
		children: Snippet;
	};

	let { name, value = 'on', checked = $bindable(false), required = false, children }: CheckboxProps = $props();
</script>

<label class="flex cursor-pointer items-start gap-2 text-small text-ink">
	<input
		type="checkbox"
		{name}
		{value}
		{required}
		bind:checked
		class="mt-0.5 size-4 flex-none cursor-pointer rounded-xs accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
	/>
	<span>{@render children()}</span>
</label>
