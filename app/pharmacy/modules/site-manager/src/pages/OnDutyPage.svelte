<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, DatePicker, EmptyState, Field, Icon, PageHeader, StickyActionBar, TimePicker, UnsavedChangesGuard } from '@crystal-pharm/ui';
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

	function describeCalendarDay(day: string): { weekday: string; dayOfMonth: string; month: string } | undefined {
		const date = new Date(`${day}T00:00:00Z`);
		if (Number.isNaN(date.getTime())) return undefined;
		const format = (options: Intl.DateTimeFormatOptions) => date.toLocaleDateString('fr-FR', { ...options, timeZone: 'UTC' });
		return { weekday: format({ weekday: 'short' }), dayOfMonth: format({ day: 'numeric' }), month: format({ month: 'short' }) };
	}
</script>

<PageHeader title="Gardes" context="Quand la pharmacie est de garde" icon="moon">
	{#snippet actions()}
		<Button variant="ghost" href="/site-manager">Retour au site</Button>
		<Button type="button" icon="plus" onclick={addPeriod} disabled={!data.isSiteCreated}>Ajouter une garde</Button>
	{/snippet}
</PageHeader>

<div class="grid gap-6">
	{#if form && 'isSaved' in form && !hasUnsavedChanges}
		<Alert tone="success" title="Gardes enregistrées">Le bandeau s’affiche sur votre site pendant chaque garde.</Alert>
	{/if}
	{#if failure}
		<Alert tone="danger" title="Les gardes n’ont pas été enregistrées">{failure.formError}</Alert>
	{/if}
	{#if !data.isSiteCreated}
		<Alert tone="warning" title="Votre site n’existe pas encore">Enregistrez d’abord votre site pour déclarer des gardes.</Alert>
	{/if}

	<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
		<form
			method="POST"
			class="grid gap-3"
			use:enhance={() =>
				async ({ result, update }) => {
					if (result.type === 'success') savedFingerprint = JSON.stringify(periods);
					await update({ reset: false });
				}}
		>
			<input type="hidden" name={onDutyPeriodsFieldName} value={JSON.stringify(periods)} />
			<div class="grid gap-0.5">
				<h2 class="font-display text-[22px] leading-7 text-ink">Prochaines gardes</h2>
				<p class="text-small text-ink-muted">Une fin avant le début, c’est le lendemain matin. Une garde passée disparaît d’elle-même.</p>
			</div>

			{#each periods as period, periodIndex (period)}
				{@const calendarDay = describeCalendarDay(period.day)}
				<!-- Une page d'éphéméride par garde : le jour se repère avant les heures. -->
				<div class="flex flex-wrap items-stretch overflow-hidden rounded-xl border border-line bg-surface shadow-card">
					<div aria-hidden="true" class="grid w-24 flex-none place-content-center justify-items-center bg-rail px-3 py-3 text-on-rail max-sm:w-full max-sm:grid-flow-col max-sm:gap-2">
						<span class="text-eyebrow text-rail-ink">{calendarDay?.weekday ?? '—'}</span>
						<span class="font-display text-[34px] leading-9 tabular-nums">{calendarDay?.dayOfMonth ?? ''}</span>
						<span class="text-small text-rail-ink">{calendarDay?.month ?? ''}</span>
					</div>
					<div class="grid min-w-0 flex-1 gap-3 p-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
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
						<Button type="button" variant="ghost" icon="trash" onclick={() => removePeriod(periodIndex)}>Retirer</Button>
						<p class="flex items-center gap-1.5 text-small text-ink-muted sm:col-span-4">
							<Icon name="moon" size={15} class="flex-none text-accent-text" />{describeOnDutyPeriodEnd(period)}
						</p>
					</div>
				</div>
			{:else}
				<EmptyState icon="moon" title="Aucune garde déclarée" description="Ajoutez vos prochaines gardes : le bandeau s’affichera tout seul au bon moment.">
					{#snippet actions()}
						<Button type="button" icon="plus" onclick={addPeriod} disabled={!data.isSiteCreated}>Ajouter une garde</Button>
					{/snippet}
				</EmptyState>
			{/each}

			{#if periods.length > 0}
				<button
					type="button"
					onclick={addPeriod}
					disabled={!data.isSiteCreated}
					class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong/50 px-4 py-3.5 text-[15px] font-bold text-ink-muted transition-colors duration-[120ms] hover:border-accent hover:text-accent-text disabled:cursor-not-allowed disabled:opacity-50"
				>
					<Icon name="plus" size={18} /> La garde suivante, une semaine plus tard
				</button>
			{/if}

			{#if hasUnsavedChanges}
				<StickyActionBar>
					<div class="flex flex-wrap items-center justify-between gap-3">
						<p class="text-small text-ink-muted" role="status">Modifications non enregistrées</p>
						<Button type="submit" icon="check" disabled={!data.isSiteCreated}>Enregistrer les gardes</Button>
					</div>
				</StickyActionBar>
			{/if}
		</form>

		<aside class="grid gap-4 lg:sticky lg:top-[calc(var(--spacing-band)+24px)]" aria-label="Sur votre site">
			<div class="grid gap-3 rounded-xl border border-line bg-surface p-5 shadow-card">
				<h2 class="text-eyebrow text-ink-subtle">Ce que voient vos patients</h2>
				<p class="flex items-center gap-2.5 rounded-lg bg-rail px-4 py-3 text-small text-on-rail">
					<Icon name="moon" size={18} class="flex-none text-accent-on-rail" />
					<span><b class="font-bold">En garde actuellement</b>, jusqu’à 08:00</span>
				</p>
				<p class="text-small text-ink-muted">
					En haut de votre site pendant la garde. Le jour même, il annonce « En garde ce soir, à partir de … ».
				</p>
			</div>
			<div class="grid justify-items-start gap-3 rounded-xl border border-line bg-surface p-5 shadow-card">
				<h2 class="font-display text-[19px] leading-6 text-ink">Le numéro de garde 3237</h2>
				<p class="text-small text-ink-muted">Un bloc de votre site : activez-le et placez-le où vous voulez, dans « Affichage ».</p>
				<Button variant="secondary" size="compact" href="/site-manager/edition#affichage">Régler son affichage</Button>
			</div>
		</aside>
	</div>
</div>

<UnsavedChangesGuard {hasUnsavedChanges} />
