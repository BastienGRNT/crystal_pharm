<script lang="ts">
	import { Alert, EmptyState, FilterTabs, Input, PageHeader, SidePanel } from '@crystal-pharm/ui';
	import PrescriptionDetail from '../components/organisms/PrescriptionDetail.svelte';
	import PrescriptionQueueCard from '../components/organisms/PrescriptionQueueCard.svelte';
	import PrescriptionQueueColumn from '../components/organisms/PrescriptionQueueColumn.svelte';
	import type {
		PrescriptionCard,
		ReceivedPrescriptionsActionResult,
		ReceivedPrescriptionsPageData
	} from './receivedPrescriptionsPageData';

	type ReceivedPrescriptionsPageProps = {
		data: ReceivedPrescriptionsPageData;
		form: ReceivedPrescriptionsActionResult | null | undefined;
	};

	let { data, form }: ReceivedPrescriptionsPageProps = $props();

	// Filtrée dans le navigateur : un nom de patient ne part jamais dans une URL.
	let searchQuery = $state('');
	const normalizedQuery = $derived(searchQuery.trim().toLocaleLowerCase('fr-FR').replace(/\s+/g, ' '));
	const isSearching = $derived(normalizedQuery !== '');
	const matchesSearch = (card: PrescriptionCard): boolean =>
		!isSearching || card.searchText.includes(normalizedQuery) || card.searchText.includes(normalizedQuery.replace(/\s/g, ''));

	const visibleCollected = $derived(data.collected.cards.filter(matchesSearch));
</script>

<svelte:head>
	<title>Ordonnances · Crystal Pharm</title>
</svelte:head>

<PageHeader title="Ordonnances" context={data.context} icon="prescription" />

{#if !data.hasAnyPrescription}
	<EmptyState
		icon="prescription"
		title="Pas encore d’ordonnance"
		description="Vos patients envoient la photo de leur ordonnance depuis votre site. Elle arrive ici, vous la préparez, ils sont prévenus quand elle est prête."
	/>
{:else}
	{#if form && !data.selected}
		{#if form.notice}
			<Alert tone="success">{form.notice}</Alert>
		{:else if form.errorMessage}
			<Alert tone="danger">{form.errorMessage}</Alert>
		{/if}
	{/if}

	<div class="flex flex-wrap items-center gap-3">
		<label class="w-full max-w-[360px]">
			<span class="sr-only">Rechercher un patient</span>
			<Input type="search" bind:value={searchQuery} placeholder="Rechercher un patient, nom ou téléphone" autocomplete="off" />
		</label>
	</div>

	{#if !isSearching}
		<div class="xl:hidden">
			<FilterTabs label="Étapes" tabs={data.columnTabs} />
		</div>
	{/if}

	<div class="grid items-start gap-3 xl:grid-cols-4">
		{#each data.columns as column (column.status)}
			<div class={isSearching || column.status === data.currentColumnStatus ? '' : 'max-xl:hidden'}>
				<PrescriptionQueueColumn {column} visibleCards={column.cards.filter(matchesSearch)} {isSearching} />
			</div>
		{/each}
	</div>

	{#if data.collected.cards.length > 0}
		<details class="group rounded-lg border border-line bg-surface" open={isSearching && visibleCollected.length > 0}>
			<summary class="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-[14px] leading-5 font-semibold text-ink">
				{data.collected.title}
				<span class="text-small font-medium text-ink-subtle">
					{visibleCollected.length} · effacées d’elles-mêmes 30 jours après le retrait
				</span>
			</summary>
			<div class="grid gap-2.5 border-t border-line p-3 sm:grid-cols-2 xl:grid-cols-4">
				{#each visibleCollected as card (card.id)}
					<PrescriptionQueueCard {card} />
				{/each}
			</div>
		</details>
	{/if}
{/if}

{#if data.selected}
	<SidePanel title={data.selected.patientName} closeHref={data.selected.closeHref} size="wide">
		<PrescriptionDetail prescription={data.selected} actionResult={form} />
	</SidePanel>
{/if}
