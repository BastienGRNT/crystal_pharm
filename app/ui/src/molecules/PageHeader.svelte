<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icon/Icon.svelte';
	import type { IconName } from '../atoms/icon/phosphorIcons';

	type PageHeaderProps = {
		icon: IconName;
		title: string;
		context?: string;
		actions?: Snippet;
	};

	let { icon, title, context, actions }: PageHeaderProps = $props();
</script>

<header class="flex flex-wrap items-end justify-between gap-4">
	<div class="flex min-w-0 items-center gap-3">
		<span class="grid size-10 flex-none place-items-center rounded-lg bg-accent-soft text-accent-text">
			<Icon name={icon} size={22} />
		</span>
		<div>
			<h1 class="text-title-1 text-ink">{title}</h1>
			{#if context}
				<p class="text-body text-ink-muted">{context}</p>
			{/if}
		</div>
	</div>
	{#if actions}
		<div class="flex flex-wrap gap-2">{@render actions()}</div>
	{/if}
</header>
