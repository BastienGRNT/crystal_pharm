<script lang="ts">
	import { formatEuros, parseEurosToCents, tools } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, Field, PageHeader, UnitInput } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const failedSave = $derived(form && !form.isSaved ? form : undefined);
	const values = $state(untrack(() => structuredClone(failedSave?.values ?? data.values)));

	const paidTotalCents = $derived(
		tools.reduce((total, tool) => total + (parseEurosToCents(values.toolPriceInputs[tool.toolKey]) ?? 0), 0)
	);
	const packPriceCents = $derived(parseEurosToCents(values.packPriceInput));
	const packSavingPercent = $derived(
		packPriceCents !== undefined && paidTotalCents > 0 ? Math.round((1 - packPriceCents / paidTotalCents) * 100) : undefined
	);
</script>

<svelte:head>
	<title>Catalogue · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="package" title="Catalogue" context="Le prix mensuel de chaque module, et du pack qui les réunit tous." />

<form method="POST" class="grid max-w-[760px] gap-3.5">
	{#if form?.isSaved}
		<Alert tone="success">Les prix sont enregistrés. Ils s’appliquent dès maintenant à l’aperçu et aux prochains paiements.</Alert>
	{/if}

	<Card>
		<div class="grid gap-1">
			<h2 class="title-2 text-ink">Les modules</h2>
			<p class="text-small text-ink-muted">Laissez vide un module qui n’est pas encore en vente ; à 0 €, il est gratuit pour toutes les pharmacies.</p>
		</div>
		<div class="mt-2">
			{#each tools as tool (tool.toolKey)}
				<div class="grid gap-3 border-t border-line-soft py-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
					<div class="min-w-0">
						<p class="body-strong text-ink">{tool.label}</p>
						<p class="text-small text-ink-muted">{tool.pitch}</p>
					</div>
					<Field label="Prix de {tool.label}" errorMessage={failedSave?.fieldErrors[tool.toolKey]}>
						{#snippet control(controlAttributes)}
							<UnitInput
								{...controlAttributes}
								name={tool.toolKey}
								unit="€ / mois"
								inputmode="decimal"
								placeholder="Pas en vente"
								bind:value={values.toolPriceInputs[tool.toolKey]}
							/>
						{/snippet}
					</Field>
				</div>
			{/each}
		</div>
	</Card>

	<Card>
		<div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
			<div class="min-w-0">
				<h2 class="title-2 text-ink">Le pack « tous les modules »</h2>
				<p class="text-small text-ink-muted">
					Appliqué dès qu’une pharmacie a tous les modules payants. Pris un par un : {formatEuros(paidTotalCents)} / mois.
					{#if packSavingPercent !== undefined && packSavingPercent > 0}
						Le pack fait économiser {packSavingPercent} %.
					{/if}
				</p>
				<p class="mt-1 text-small text-ink-subtle">Pensez à le revoir quand un module est ajouté au catalogue.</p>
			</div>
			<Field label="Prix du pack" errorMessage={failedSave?.fieldErrors.pack}>
				{#snippet control(controlAttributes)}
					<UnitInput
						{...controlAttributes}
						name="pack"
						unit="€ / mois"
						inputmode="decimal"
						placeholder="Pas de pack"
						bind:value={values.packPriceInput}
					/>
				{/snippet}
			</Field>
		</div>
	</Card>

	<div><Button type="submit" icon="check">Enregistrer les prix</Button></div>
</form>
