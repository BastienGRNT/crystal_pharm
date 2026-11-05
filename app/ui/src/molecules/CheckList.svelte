<script lang="ts">
	import Icon from '../atoms/icons/Icon.svelte';
	import type { CheckListItem } from './checkList';

	/** Des `span` et des rôles plutôt qu'un `ul` : la liste peut vivre dans un `label` (une carte à cocher). */
	let { items }: { items: CheckListItem[] } = $props();
</script>

<span role="list" class="grid gap-2">
	{#each items as item (item.title)}
		{@const isPending = item.isChecked === false}
		<span role="listitem" class="flex items-start gap-2">
			<Icon name="check-circle" size={18} class="mt-px flex-none {isPending ? 'text-ink-muted' : 'text-success'}" />
			<span class="grid gap-0.5">
				<span class="text-small {isPending ? 'text-ink-muted' : 'font-semibold text-ink'}">
					{#if item.isChecked !== undefined}<span class="sr-only">{isPending ? 'À remplir :' : 'Rempli :'}</span>{/if}
					{item.title}
				</span>
				{#if item.description}<span class="text-small text-ink-muted">{item.description}</span>{/if}
			</span>
		</span>
	{/each}
</span>
