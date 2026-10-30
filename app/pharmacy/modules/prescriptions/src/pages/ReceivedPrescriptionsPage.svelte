<script lang="ts">
	import { Button, Card, DataTable, DescriptionList, EmptyState, PageHeader, Tag, TextLink } from '@crystal-pharm/ui';
	import type { ReceivedPrescriptionsPageData } from './receivedPrescriptionsPageData';

	let { data }: { data: ReceivedPrescriptionsPageData } = $props();

	const context = $derived.by(() => {
		const prescriptionCount = data.rows.length;
		if (prescriptionCount === 0) return 'Aucune ordonnance reçue';
		const plural = prescriptionCount > 1 ? 's' : '';
		return `${prescriptionCount} ordonnance${plural} reçue${plural}`;
	});
</script>

<svelte:head>
	<title>Ordonnances · Crystal Pharm</title>
</svelte:head>

<PageHeader title="Ordonnances" {context} icon="prescription" />

<div class="mt-6 grid gap-6">
	{#if data.selected}
		<Card>
			<div class="flex flex-wrap items-start justify-between gap-4">
				<h2 class="title-2 text-ink">{data.selected.patientName}</h2>
				<Button variant="secondary" href={data.selected.closeHref}>Fermer</Button>
			</div>
			<div class="mt-4 grid gap-6 md:grid-cols-2">
				<DescriptionList items={data.selected.items} />
				<div class="grid content-start gap-2">
					<p class="text-[12px] leading-4 font-medium text-ink-muted">Fichiers</p>
					{#each data.selected.files as file (file.href)}
						<Button variant="secondary" icon="file-text" href={file.href} opensInNewTab>{file.label}</Button>
					{/each}
				</div>
			</div>
		</Card>
	{/if}

	{#if data.rows.length === 0}
		<EmptyState
			icon="prescription"
			title="Pas encore d'ordonnance"
			description="Les ordonnances envoyées par tes patients depuis ton site apparaîtront ici."
		/>
	{:else}
		<DataTable caption="Ordonnances reçues">
			{#snippet head()}
				<th>Patient</th>
				<th>Téléphone</th>
				<th>Passage prévu</th>
				<th>Reçue le</th>
				<th>Fichiers</th>
			{/snippet}
			{#each data.rows as row (row.id)}
				<tr class={row.isSelected ? 'bg-accent-soft' : ''}>
					<td>
						<TextLink href={row.href}>{row.patientName}</TextLink>
						{#if row.hasAlreadyVisited}
							<Tag tone="accent">Déjà venu(e)</Tag>
						{/if}
					</td>
					<td class="tabular-nums">{row.phone}</td>
					<td class="tabular-nums">{row.plannedVisit}</td>
					<td class="tabular-nums">{row.receivedAt}</td>
					<td class="tabular-nums">{row.documentCount}</td>
				</tr>
			{/each}
		</DataTable>
	{/if}
</div>
