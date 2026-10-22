<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';
	import type { IconName } from '../atoms/icons/icons';

	type PageHeaderProps = {
		title: string;
		context: string;
		icon?: IconName;
		actions?: Snippet;
	};

	let { title, context, icon, actions }: PageHeaderProps = $props();
</script>

<header class="flex flex-wrap items-center justify-between gap-4">
	<div class="flex min-w-0 items-center gap-3">
		{#if icon}
			<span class="grid size-10 flex-none place-items-center rounded-md bg-accent-soft text-accent-text">
				<Icon name={icon} size={22} />
			</span>
		{/if}
		<div class="min-w-0">
			<h1 class="title-1 text-ink">{title}</h1>
			<p class="mt-px text-[13.5px] leading-5 text-ink-muted">{context}</p>
		</div>
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</header>
