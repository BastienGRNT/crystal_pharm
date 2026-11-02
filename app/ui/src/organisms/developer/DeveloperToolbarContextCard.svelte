<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';
	import type { DeveloperToolbarContext, DeveloperToolbarFactTone } from './developerToolbar';

	let { context }: { context: DeveloperToolbarContext } = $props();

	const factToneClasses: Record<DeveloperToolbarFactTone, string> = {
		neutral: 'text-ink',
		success: 'text-success',
		warning: 'text-warning'
	};
</script>

<section aria-label="Le compte connecté" class="overflow-hidden rounded-md border border-line bg-surface shadow-card">
	<header class="border-b border-dashed border-line px-3.5 py-3">
		<p class="title-2">{context.title}</p>
		{#if context.subtitle}<p class="text-small text-ink-muted">{context.subtitle}</p>{/if}
	</header>
	{#if context.facts.length > 0}
		<dl class="grid grid-cols-[minmax(96px,auto)_1fr] gap-x-3 gap-y-1.5 px-3.5 py-3">
			{#each context.facts as fact (fact.label)}
				<dt class="text-small text-ink-subtle">{fact.label}</dt>
				<dd class="text-small font-semibold {factToneClasses[fact.tone ?? 'neutral']}">{fact.value}</dd>
			{/each}
		</dl>
	{/if}
	{#if context.links.length > 0}
		<div class="flex flex-wrap gap-2 border-t border-line-soft bg-surface-subtle px-3.5 py-2.5">
			{#each context.links as link (link.href)}
				<a
					href={link.href}
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center gap-1.5 rounded-sm text-[13px] font-semibold text-accent-text hover:underline"
				>
					{link.label}
					<Icon name="arrow-square-out" size={14} />
				</a>
			{/each}
		</div>
	{/if}
</section>
