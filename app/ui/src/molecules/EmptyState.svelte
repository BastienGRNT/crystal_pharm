<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';
	import type { IconName } from '../atoms/icons/icons';

	type EmptyStateProps = {
		icon: IconName;
		title: string;
		description: string;
		actions?: Snippet;
	};

	let { icon, title, description, actions }: EmptyStateProps = $props();
</script>

<div class="grid justify-items-center gap-3 rounded-lg border border-dashed border-line-strong bg-surface-subtle px-6 py-10 text-center">
	<span class="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-text">
		<Icon name={icon} size={24} />
	</span>
	<div class="grid max-w-md gap-1">
		<p class="title-2 text-ink">{title}</p>
		<p class="text-body text-ink-muted">{description}</p>
	</div>
	{#if actions}
		<div class="flex flex-wrap justify-center gap-2">{@render actions()}</div>
	{/if}
</div>
