<script lang="ts">
	import { Alert, EmptyState, FilterTabs, Icon, Input, PageHeader, SidePanel } from '@crystal-pharm/ui';
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

<PageHeader title="Ordonnances" context={data.context} icon="prescription">
	{#snippet actions()}
		{#if data.hasAnyPrescription}
			<label class="relative w-80 max-sm:w-full">
				<span class="sr-only">Rechercher un patient</span>
				<Icon name="magnifying-glass" size={18} class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-subtle" />
				<Input type="search" bind:value={searchQuery} placeholder="Un nom, un téléphone…" autocomplete="off" class="pl-10" />
			</label>
		{/if}
	{/snippet}
</PageHeader>

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

	{#if !isSearching}
		<div class="xl:hidden">
			<FilterTabs label="Étapes" tabs={data.columnTabs} />
		</div>
	{/if}

	<div class="grid items-start gap-5 xl:grid-cols-4">
		{#each data.columns as column (column.status)}
			<div class={isSearching || column.status === data.currentColumnStatus ? '' : 'max-xl:hidden'}>
				<PrescriptionQueueColumn {column} visibleCards={column.cards.filter(matchesSearch)} {isSearching} />
			</div>
		{/each}
	</div>

	{#if data.collected.cards.length > 0}
		<details class="group rounded-xl border border-line bg-surface-subtle" open={isSearching && visibleCollected.length > 0}>
			<summary class="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 [&::-webkit-details-marker]:hidden">
				<Icon name="check-circle" size={20} class="flex-none text-ink-subtle" />
				<span class="text-[15px] leading-5 font-bold text-ink">{data.collected.title}</span>
				<span class="rounded-full bg-surface-muted px-2.5 py-0.5 text-small font-bold text-ink-muted tabular-nums">{visibleCollected.length}</span>
				<span class="ml-auto text-small text-ink-subtle max-sm:hidden">Effacées d’elles-mêmes 30 jours après le retrait</span>
				<Icon name="caret-down" size={16} class="flex-none text-ink-subtle transition-transform group-open:rotate-180 max-sm:ml-auto" />
			</summary>
			<div class="grid gap-3 border-t border-dashed border-line-strong/50 p-4 sm:grid-cols-2 xl:grid-cols-4">
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
