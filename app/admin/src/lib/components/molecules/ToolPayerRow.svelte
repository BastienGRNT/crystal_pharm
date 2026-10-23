<script lang="ts">
	import { describeIncludedTools, formatEuros, type Tool } from '@crystal-pharm/billing-db/domain';
	import { ChoiceGroup, Field, UnitInput } from '@crystal-pharm/ui';
	import type { ToolTermsFormValue } from '$lib/groupForm/groupFormValues';

	type ToolPayerRowProps = {
		tool: Tool;
		/** `undefined` : le module n'est pas encore en vente. */
		listPriceCents: number | undefined;
		toolTerms: ToolTermsFormValue;
		errorMessage?: string;
	};

	let { tool, listPriceCents, toolTerms = $bindable(), errorMessage }: ToolPayerRowProps = $props();

	const payerOptions = [
		{ value: 'group', label: 'Le groupement' },
		{ value: 'shared', label: 'Partagé' },
		{ value: 'pharmacy', label: 'La pharmacie' }
	];
</script>

<div class="grid gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start">
	<div class="min-w-0">
		<p class="body-strong text-ink">{tool.label}</p>
		<p class="text-small text-ink-muted">
			{listPriceCents === undefined ? 'Pas encore en vente' : `${formatEuros(listPriceCents)} HT / mois`}
		</p>
		{#if describeIncludedTools(tool.toolKey)}<p class="text-small text-ink-muted">{describeIncludedTools(tool.toolKey)}</p>{/if}
	</div>
	<div class="grid gap-2">
		<ChoiceGroup name="choice-payer-{tool.toolKey}" legend="Qui paie {tool.label} ?" options={payerOptions} bind:value={toolTerms.payer} />
		{#if toolTerms.payer === 'shared'}
			<Field label="Part payée par le groupement" hint="La pharmacie paie le reste." {errorMessage}>
				{#snippet control(controlAttributes)}
					<UnitInput {...controlAttributes} unit="%" inputmode="numeric" class="max-w-[160px]" bind:value={toolTerms.groupSharePercent} />
				{/snippet}
			</Field>
		{:else if errorMessage}
			<p class="text-small font-medium text-danger">{errorMessage}</p>
		{/if}
	</div>
</div>
