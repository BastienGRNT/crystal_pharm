<script lang="ts">
	import { formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Icon, Tag, type IconName, type ModuleKey } from '@crystal-pharm/ui';
	import { formatLastDayBefore } from '../../dateFormats';
	import { activeToolCardStatuses, type ToolCard } from '../../domain/toolCards';
	import { homePathnames, subscriptionPathnameHighlighting } from '../../homePathnames';

	type ToolTileProps = {
		toolCard: ToolCard;
		href: string | undefined;
		icon: IconName | undefined;
		module: ModuleKey | undefined;
		groupName: string | undefined;
	};

	let { toolCard, href, icon, module, groupName }: ToolTileProps = $props();

	const isActive = $derived(activeToolCardStatuses.includes(toolCard.status));
	const tileHref = $derived.by(() => {
		if (isActive) return href;
		if (toolCard.status === 'available') return subscriptionPathnameHighlighting(toolCard.toolKey);
		if (toolCard.status === 'needs-another') return `${homePathnames.subscription}#modules`;
		return undefined;
	});
</script>

<svelte:element
	this={tileHref ? 'a' : 'div'}
	href={tileHref}
	data-module={module}
	class="group grid content-start gap-3 rounded-lg border p-4 no-underline shadow-card transition-colors duration-[120ms] {isActive
		? 'border-line bg-surface hover:border-accent'
		: 'border-dashed border-line-strong bg-surface-subtle hover:border-accent'}"
>
	<span class="flex items-center justify-between gap-2">
		<span
			class="grid size-9 place-items-center rounded-md {isActive ? 'bg-accent-soft text-accent-text' : 'bg-surface-muted text-ink-subtle'}"
		>
			<Icon name={isActive ? (icon ?? 'puzzle-piece') : 'lock-simple'} size={20} />
		</span>
		{#if toolCard.status === 'included'}
			<Tag tone="success">{groupName ? `Offert par ${groupName}` : 'Inclus'}</Tag>
		{:else if toolCard.status === 'subscribed'}
			<Tag tone="success">Actif</Tag>
		{:else if toolCard.status === 'comes-with'}
			<Tag tone="success">Compris</Tag>
		{:else if toolCard.status === 'ending' && toolCard.endsAt}
			<Tag tone="warning">Jusqu’au {formatLastDayBefore(toolCard.endsAt)}</Tag>
		{:else if toolCard.status === 'unavailable'}
			<Tag>Bientôt</Tag>
		{/if}
	</span>
	<span class="grid gap-0.5">
		<span class="body-strong text-ink">{toolCard.label}</span>
		<span class="text-small text-ink-muted">{toolCard.pitch}</span>
	</span>
	{#if isActive}
		<span class="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text">
			Ouvrir <Icon name="arrow-right" size={14} />
		</span>
	{:else if toolCard.status === 'needs-another'}
		<span class="flex flex-wrap items-center justify-between gap-2">
			<span class="text-small text-ink-muted">{toolCard.inclusionWording}</span>
			<span class="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text">
				Voir <Icon name="arrow-right" size={14} />
			</span>
		</span>
	{:else if toolCard.status === 'available'}
		<span class="flex flex-wrap items-center justify-between gap-2">
			<span class="text-small text-ink-muted">
				{formatEuros(toolCard.pharmacyPriceCents)} HT / mois{toolCard.coverageSummary ? ` · ${toolCard.coverageSummary}` : ''}
			</span>
			<span class="inline-flex items-center gap-1 text-[13px] font-semibold text-accent-text">
				Activer <Icon name="arrow-right" size={14} />
			</span>
		</span>
	{/if}
</svelte:element>
