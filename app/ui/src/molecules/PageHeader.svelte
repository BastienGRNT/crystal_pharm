<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';
	import type { IconName } from '../atoms/icons/icons';

	type PageHeaderProps = {
		title: string;
		context: string;
		icon?: IconName;
		/** Les actions de la page : toujours en haut à droite, jamais à chercher plus bas. */
		actions?: Snippet;
		/** Sous le titre : les onglets ou les filtres de la page. */
		navigation?: Snippet;
	};

	let { title, context, icon, actions, navigation }: PageHeaderProps = $props();
</script>

<header class="grid gap-4 border-b border-line {navigation ? '' : 'pb-4'}">
	<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
		<div class="min-w-0">
			<p class="flex items-center gap-1.5 text-small font-semibold text-ink-muted">
				{#if icon}<Icon name={icon} size={17} class="flex-none text-accent-text" />{/if}
				<span class="min-w-0">{context}</span>
			</p>
			<h1 class="mt-1 title-1 text-ink max-lg:title-mobile">{title}</h1>
		</div>
		{#if actions}
			<div class="flex flex-wrap items-center gap-2">
				{@render actions()}
			</div>
		{/if}
	</div>
	{#if navigation}
		{@render navigation()}
	{/if}
</header>
