<script lang="ts">
	import { findTool, sellableToolKeys, tools, type ToolCatalog } from '@crystal-pharm/billing-db/domain';
	import { ChoiceGroup, Field, UnitInput } from '@crystal-pharm/ui';
	import ToolPayerRow from '$lib/components/molecules/ToolPayerRow.svelte';
	import type { GroupFormErrors, GroupFormValues } from '$lib/groupForm/groupFormValues';

	type WhoPaysStepProps = {
		values: GroupFormValues;
		catalog: ToolCatalog;
		fieldErrors: GroupFormErrors;
	};

	let { values = $bindable(), catalog, fieldErrors }: WhoPaysStepProps = $props();

	const sellableLabels = sellableToolKeys.map((toolKey) => findTool(toolKey).label).join(' et ');
	const includedTools = tools.filter((tool) => !sellableToolKeys.includes(tool.toolKey));
	const whoPaysOptions = [
		{
			value: 'group',
			label: 'Le groupement paie tout',
			icon: 'gift' as const,
			description: `Ses pharmacies ont ${sellableLabels} sans rien payer.`
		},
		{
			value: 'depends',
			label: 'Ça dépend du module',
			icon: 'puzzle-piece' as const,
			description: 'Module par module : payé par le groupement, partagé, ou par la pharmacie.'
		},
		{
			value: 'pharmacies',
			label: 'Les pharmacies paient',
			icon: 'storefront' as const,
			description: 'Le groupement ne paie rien. Il peut négocier une remise pour elles.'
		}
	];
	const discountOptions = [
		{ value: 'none', label: 'Pas de remise' },
		{ value: 'same', label: 'La même sur tout' },
		{ value: 'per-tool', label: 'Module par module' }
	];

	const firstToolError = $derived(sellableToolKeys.map((toolKey) => fieldErrors[toolKey]).find(Boolean));

	function findListPriceCents(toolKey: string): number | undefined {
		return catalog.toolPrices.find((toolPrice) => toolPrice.toolKey === toolKey)?.monthlyPriceCents;
	}
</script>

<div class="grid gap-5">
	<div class="grid gap-1">
		<h2 class="title-2 text-ink">Qui paie les modules de ses pharmacies ?</h2>
		<p class="text-small text-ink-muted">
			{includedTools.map((tool) => tool.label).join(' et ')} ne se vendent pas seuls : ils viennent avec
			{sellableToolKeys.map((toolKey) => findTool(toolKey).label).join(' ou ')}.
		</p>
	</div>

	<ChoiceGroup name="choice-whoPays" legend="Qui paie les modules" layout="cards" options={whoPaysOptions} bind:value={values.whoPays} />

	{#if values.whoPays === 'depends'}
		<div class="rounded-md border border-line p-4">
			{#each tools.filter((tool) => sellableToolKeys.includes(tool.toolKey)) as tool (tool.toolKey)}
				<ToolPayerRow
					{tool}
					listPriceCents={findListPriceCents(tool.toolKey)}
					bind:toolTerms={values.toolTerms[tool.toolKey]}
					errorMessage={values.discountScope === 'per-tool' ? undefined : fieldErrors[tool.toolKey]}
				/>
			{/each}
		</div>
	{/if}

	<div class="grid gap-3">
		<div class="grid gap-1">
			<h3 class="body-strong text-ink">Une remise négociée ?</h3>
			<p class="text-small text-ink-muted">Elle baisse le prix catalogue, pour la pharmacie comme pour le groupement.</p>
		</div>
		<ChoiceGroup name="choice-discountScope" legend="Une remise négociée" options={discountOptions} bind:value={values.discountScope} />
		{#if values.discountScope === 'same'}
			<Field label="Remise sur tous les modules" errorMessage={firstToolError}>
				{#snippet control(controlAttributes)}
					<UnitInput {...controlAttributes} unit="%" inputmode="numeric" placeholder="15" class="max-w-[160px]" bind:value={values.discountPercent} />
				{/snippet}
			</Field>
		{:else if values.discountScope === 'per-tool'}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each tools.filter((tool) => sellableToolKeys.includes(tool.toolKey)) as tool (tool.toolKey)}
					<Field label="Remise sur {tool.label}" errorMessage={fieldErrors[tool.toolKey]}>
						{#snippet control(controlAttributes)}
							<UnitInput {...controlAttributes} unit="%" inputmode="numeric" placeholder="0" bind:value={values.toolTerms[tool.toolKey].discountPercent} />
						{/snippet}
					</Field>
				{/each}
			</div>
		{/if}
	</div>
</div>
