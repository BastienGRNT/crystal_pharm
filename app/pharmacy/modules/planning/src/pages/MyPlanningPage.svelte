<script lang="ts">
	import { Alert, Card, PageHeader, StatusBadge, WeekNav } from '@crystal-pharm/ui';
	import AvailabilityRequestForm from '../components/organisms/my-planning/AvailabilityRequestForm.svelte';
	import MyAvailabilityRuleList from '../components/organisms/my-planning/MyAvailabilityRuleList.svelte';
	import LeaveRequestForm from '../components/organisms/my-planning/LeaveRequestForm.svelte';
	import MyLeaveList from '../components/organisms/my-planning/MyLeaveList.svelte';
	import type { AddAvailabilityFailure, LeaveRequestFailure, LeaveRequestFeedback, MyPlanningPageData } from './myPlanningPageData';

	type MyPlanningPageProps = {
		data: MyPlanningPageData;
		form: AddAvailabilityFailure | LeaveRequestFailure | LeaveRequestFeedback | null | undefined;
	};

	let { data, form }: MyPlanningPageProps = $props();

	const unreadNotices = $derived(data.notices.filter((notice) => !notice.isRead));
</script>

<svelte:head>
	<title>Mon planning · Crystal Pharm</title>
</svelte:head>

<PageHeader title="Mon planning" context={data.firstName ? `Bonjour ${data.firstName}` : ''} icon="calendar-dots" />

{#if unreadNotices.length > 0}
	<Alert tone="info" title="Nouveau">
		<ul>
			{#each unreadNotices as notice (notice.id)}<li>{notice.message}</li>{/each}
		</ul>
	</Alert>
{/if}

<div class="flex flex-wrap items-center gap-3">
	<WeekNav
		weekLabel={data.periodLabel}
		previousWeekHref={data.previousWeekHref}
		nextWeekHref={data.nextWeekHref}
		navigationLabel="Semaine affichée"
		previousLabel="Semaine précédente"
		nextLabel="Semaine suivante"
		todayHref={data.todayHref}
	/>
	{#if data.isWeekPublished}
		<StatusBadge tone="neutral">{data.plannedDurationLabel} prévues</StatusBadge>
	{/if}
</div>

{#if !data.isWeekPublished}
	<p class="text-body text-ink-muted">Cette semaine est en préparation : votre titulaire ne l’a pas encore publiée.</p>
{:else}
	<ul class="grid gap-2 sm:grid-cols-7">
		{#each data.days as day (day.date)}
			<li class="rounded-md border bg-surface p-3 {day.isToday ? 'border-accent' : 'border-line'}">
				<p class="text-small font-semibold text-ink">{day.title}</p>
				{#if day.absenceLabel}
					<p class="mt-1 text-small text-ink-muted">{day.absenceLabel}</p>
				{:else if day.shiftLabels.length === 0}
					<p class="mt-1 text-small text-ink-muted">Repos</p>
				{:else}
					{#each day.shiftLabels as shiftLabel}
						<p class="mt-1 text-body">{shiftLabel}</p>
					{/each}
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<section class="grid gap-3" aria-label="Mes congés">
	<h2 class="text-body font-semibold text-ink">Mes congés</h2>
	{#if form && 'leaveConfirmation' in form}
		<Alert tone={form.isTeamSufficient ? 'success' : 'warning'} title="Demande envoyée">{form.leaveConfirmation}</Alert>
	{/if}
	<MyLeaveList leaves={data.leaves} cancelFormAction={data.cancelLeaveFormAction} />
</section>

<Card>
	<h2 class="mb-1 text-body font-semibold text-ink">Demander un congé</h2>
	<p class="mb-3.5 text-small text-ink-muted">
		Votre titulaire reçoit la demande, voit tout de suite s’il reste assez de monde, et l’accepte ou la refuse.
	</p>
	<LeaveRequestForm
		formAction={data.requestLeaveFormAction}
		leaveKinds={data.requestableLeaveKinds}
		defaultDate={data.todayDate}
		errorMessage={form && 'leaveMessage' in form ? form.leaveMessage : undefined}
		submittedValues={form && 'leaveValues' in form ? form.leaveValues : undefined}
	/>
</Card>

<section class="grid gap-3" aria-label="Mes disponibilités">
	<h2 class="text-body font-semibold text-ink">Mes indisponibilités et disponibilités</h2>
	<MyAvailabilityRuleList rules={data.rules} removeFormAction={data.removeAvailabilityFormAction} />
</section>

<Card>
	<h2 class="mb-1 text-body font-semibold text-ink">Signaler une indisponibilité</h2>
	<p class="mb-3.5 text-small text-ink-muted">
		{data.isAvailabilityAutomaticallyValidated
			? 'Votre demande est prise en compte tout de suite.'
			: 'Votre titulaire reçoit la demande et l’accepte ou la refuse.'}
	</p>
	<AvailabilityRequestForm
		formAction={data.addAvailabilityFormAction}
		errorMessage={form && 'message' in form ? form.message : undefined}
		submittedValues={form && 'values' in form ? form.values : undefined}
	/>
</Card>
