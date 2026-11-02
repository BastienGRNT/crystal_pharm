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

<div class="grid justify-items-center gap-4 rounded-xl border-2 border-dashed border-line px-6 py-12 text-center">
	<span class="grid size-14 rotate-[-4deg] place-items-center rounded-lg border-2 border-accent/40 bg-accent-soft text-accent-text">
		<Icon name={icon} size={26} />
	</span>
	<div class="grid max-w-md gap-1.5">
		<p class="font-display text-[22px] leading-7 text-ink">{title}</p>
		<p class="text-body text-ink-muted">{description}</p>
	</div>
	{#if actions}
		<div class="flex flex-wrap justify-center gap-2">{@render actions()}</div>
	{/if}
</div>
