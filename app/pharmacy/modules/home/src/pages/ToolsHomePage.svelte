<script lang="ts">
	import { Button, Card, Icon, PageHeader } from '@crystal-pharm/ui';
	import { homePathnames } from '../homePathnames';

	let { isOpeningScheduleMissing }: { isOpeningScheduleMissing: boolean } = $props();
</script>

<svelte:head>
	<title>Accueil · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="house" title="Accueil" context="Les outils de votre pharmacie." />

{#if isOpeningScheduleMissing}
	<Card>
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex min-w-0 items-start gap-3">
				<span class="grid size-10 flex-none place-items-center rounded-md bg-warning-soft text-warning">
					<Icon name="clock" size={22} />
				</span>
				<div class="min-w-0">
					<h2 class="title-2 text-ink">Complétez votre fiche : horaires d’ouverture</h2>
					<p class="text-body text-ink-muted">Ils s’afficheront sur le site de votre pharmacie.</p>
				</div>
			</div>
			<Button href={homePathnames.pharmacyOpeningHours} icon="clock">Renseigner les horaires</Button>
		</div>
	</Card>
{/if}
