<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Card, DatePicker, EmptyState, Field, PageHeader, TimePicker, UnsavedChangesGuard } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import { createNextOnDutyPeriodDraft, describeOnDutyPeriodEnd } from '../domain/onDutyPeriods';
	import { onDutyPeriodsFieldName, type OnDutyFailure, type OnDutyPageData, type OnDutySaved } from './onDutyPageData';

	type OnDutyPageProps = {
		data: OnDutyPageData;
		form: OnDutyFailure | OnDutySaved | null | undefined;
	};

	let { data, form }: OnDutyPageProps = $props();

	const failure = $derived(form && 'formError' in form ? form : undefined);
	let periods = $state(structuredClone(untrack(() => failure?.submittedPeriods ?? data.periods)));
	let savedFingerprint = $state(untrack(() => JSON.stringify(data.periods)));
	const hasUnsavedChanges = $derived(JSON.stringify(periods) !== savedFingerprint);

	function addPeriod(): void {
		periods.push(createNextOnDutyPeriodDraft(periods, new Date()));
	}

	function removePeriod(periodIndex: number): void {
		periods.splice(periodIndex, 1);
	}
</script>

<div class="grid gap-6">
	<PageHeader title="Gardes" context="Quand la pharmacie est de garde" icon="moon">
		{#snippet actions()}
			<Button variant="ghost" href="/site-manager">Retour au site</Button>
		{/snippet}
	</PageHeader>

	{#if form && 'isSaved' in form && !hasUnsavedChanges}
		<Alert tone="success" title="Gardes enregistrées">Le bandeau s’affiche sur votre site pendant chaque garde.</Alert>
	{/if}
	{#if failure}
		<Alert tone="danger" title="Les gardes n’ont pas été enregistrées">{failure.formError}</Alert>
	{/if}
	{#if !data.isSiteCreated}
		<Alert tone="warning" title="Votre site n’existe pas encore">Enregistrez d’abord votre site pour déclarer des gardes.</Alert>
	{/if}

	<Card spacing="spacious">
		<form
			method="POST"
			class="grid gap-5"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'success') savedFingerprint = JSON.stringify(periods);
					await update({ reset: false });
				}}
		>
			<input type="hidden" name={onDutyPeriodsFieldName} value={JSON.stringify(periods)} />
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 class="text-[15px] leading-5 font-semibold text-ink">Mes gardes</h2>
					<p class="text-small text-ink-subtle">
						Pendant une garde, un bandeau « En garde actuellement, jusqu’à … » s’affiche en haut de votre site. Le jour d’une garde, il annonce « En garde ce soir, à partir de … ». Si la fin est avant le début, la garde se termine le lendemain.
					</p>
				</div>
				<Button type="button" variant="secondary" icon="plus" onclick={addPeriod}>Ajouter une garde</Button>
			</div>

			{#if periods.length === 0}
				<EmptyState icon="moon" title="Aucune garde déclarée" description="Ajoutez vos prochaines gardes : le bandeau s’affichera tout seul au bon moment." />
			{/if}

			{#each periods as period, periodIndex (period)}
				<div class="grid items-end gap-3 sm:grid-cols-[auto_auto_auto_1fr_auto]">
					<Field label="Jour de début">
						{#snippet control(attributes)}
							<DatePicker id={attributes.id} name="periodDay" bind:value={period.day} />
						{/snippet}
					</Field>
					<Field label="De">
						{#snippet control(attributes)}
							<TimePicker id={attributes.id} name="periodStartTime" bind:value={period.startTime} stepMinutes={15} />
						{/snippet}
					</Field>
					<Field label="À">
						{#snippet control(attributes)}
							<TimePicker id={attributes.id} name="periodEndTime" bind:value={period.endTime} stepMinutes={15} />
						{/snippet}
					</Field>
					<p class="text-small text-ink-muted sm:pb-2.5">{describeOnDutyPeriodEnd(period)}</p>
					<Button type="button" variant="ghost" icon="trash" onclick={() => removePeriod(periodIndex)}>Retirer</Button>
				</div>
			{/each}

			<div class="flex flex-wrap items-center gap-3 border-t border-line-soft pt-4">
				<Button type="submit" icon="check" disabled={!data.isSiteCreated || !hasUnsavedChanges}>Enregistrer les gardes</Button>
				{#if hasUnsavedChanges}
					<p class="text-small text-ink-muted" role="status">Modifications non enregistrées</p>
				{/if}
			</div>
		</form>
	</Card>

	<Card spacing="spacious">
		<h2 class="text-[15px] leading-5 font-semibold text-ink">Le numéro de garde 3237</h2>
		<p class="text-small text-ink-subtle">
			Le rappel du 3237 se règle comme un bloc de votre site : activez-le et placez-le où vous voulez, dans « Affichage ».
		</p>
		<div class="mt-3">
			<Button variant="secondary" href="/site-manager#affichage">Régler son affichage</Button>
		</div>
	</Card>
</div>

<UnsavedChangesGuard {hasUnsavedChanges} />
