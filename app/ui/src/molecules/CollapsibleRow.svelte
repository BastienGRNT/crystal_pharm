<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';

	type CollapsibleRowProps = {
		/** La ligne lue d'un coup d'œil : ce qu'on cherche sans rien déplier. */
		summary: Snippet;
		/** Ce qui se modifie, une fois la ligne dépliée. */
		children: Snippet;
		open?: boolean;
		hasError?: boolean;
		id?: string;
	};

	let { summary, children, open = $bindable(false), hasError = false, id }: CollapsibleRowProps = $props();
</script>

<details
	{id}
	bind:open
	class="group scroll-mt-[calc(var(--spacing-topbar)+64px)] rounded-lg border bg-surface {hasError ? 'border-danger' : 'border-line'}"
>
	<summary class="flex cursor-pointer list-none items-center gap-3 rounded-lg p-4 hover:bg-surface-subtle [&::-webkit-details-marker]:hidden">
		<div class="min-w-0 flex-1">{@render summary()}</div>
		<span class="flex flex-none items-center gap-1 text-[14px] leading-5 font-medium text-accent-text">
			<span class="max-sm:sr-only">{open ? 'Replier' : 'Modifier'}</span>
			<Icon name="caret-down" size={16} class="transition-transform duration-[120ms] group-open:rotate-180" />
		</span>
	</summary>
	<div class="border-t border-line-soft p-4">{@render children()}</div>
</details>
