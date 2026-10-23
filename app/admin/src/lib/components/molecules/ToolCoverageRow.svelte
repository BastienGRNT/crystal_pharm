<script lang="ts">
	import { formatEuros, type Tool } from '@crystal-pharm/billing-db/domain';
	import { ChoiceGroup, Field, UnitInput } from '@crystal-pharm/ui';
	import { coverageModeOptions, type ToolCoverageFormValue } from '$lib/groupForm/groupFormValues';

	type ToolCoverageRowProps = {
		tool: Tool;
		/** `undefined` : le module n'est pas encore en vente. */
		listPriceCents: number | undefined;
		coverage: ToolCoverageFormValue;
		errorMessage?: string;
	};

	let { tool, listPriceCents, coverage = $bindable(), errorMessage }: ToolCoverageRowProps = $props();

	const fieldNamePrefix = $derived(`coverage.${tool.toolKey}`);
</script>

<div class="grid gap-3 border-t border-line-soft py-4 first:border-t-0 first:pt-0 md:grid-cols-[180px_minmax(0,1fr)] md:items-start">
	<div class="min-w-0">
		<p class="body-strong text-ink">{tool.label}</p>
		<p class="text-small text-ink-muted">
			{listPriceCents === undefined ? 'Pas encore en vente' : `${formatEuros(listPriceCents)} / mois au catalogue`}
		</p>
	</div>

	<div class="grid gap-3">
		<ChoiceGroup
			name="{fieldNamePrefix}.mode"
			legend="Prise en charge du module {tool.label}"
			options={coverageModeOptions}
			bind:value={coverage.mode}
		/>

		{#if coverage.mode !== 'none'}
			<div class="grid gap-3 sm:grid-cols-2">
				<Field
					label={coverage.mode === 'full' ? 'Remise négociée (facultatif)' : 'Remise'}
					hint={coverage.mode === 'full' ? 'Baisse ce que paie le groupement.' : 'Sur le prix catalogue, pour la pharmacie et le groupement.'}
				>
					{#snippet control(controlAttributes)}
						<UnitInput
							{...controlAttributes}
							name="{fieldNamePrefix}.discountPercent"
							unit="%"
							inputmode="numeric"
							placeholder="0"
							bind:value={coverage.discountPercent}
						/>
					{/snippet}
				</Field>
				{#if coverage.mode === 'shared'}
					<Field label="Part payée par le groupement" hint="Le reste est payé par la pharmacie, si elle s’abonne.">
						{#snippet control(controlAttributes)}
							<UnitInput
								{...controlAttributes}
								name="{fieldNamePrefix}.groupSharePercent"
								unit="%"
								inputmode="numeric"
								bind:value={coverage.groupSharePercent}
							/>
						{/snippet}
					</Field>
				{/if}
			</div>
		{/if}

		{#if errorMessage}
			<p class="text-small font-medium text-danger">{errorMessage}</p>
		{/if}
	</div>
</div>
