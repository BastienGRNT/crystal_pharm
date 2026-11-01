<script lang="ts">
	import { Alert, Button, PageHeader, SidePanel, WeekNav } from '@crystal-pharm/ui';
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
	const leaveFailure = $derived(form && 'leaveMessage' in form ? form : undefined);
	const availabilityFailure = $derived(form && 'message' in form ? form : undefined);
	// Un envoi refusé rouvre son panneau : la saisie n'est pas perdue.
	const isLeavePanelOpen = $derived(data.openedRequestPanel === 'leave' || leaveFailure !== undefined);
	const isAvailabilityPanelOpen = $derived(data.openedRequestPanel === 'availability' || availabilityFailure !== undefined);

	const sectionTitleClasses = 'font-display text-[21px] leading-7 text-ink';
</script>

<svelte:head>
	<title>Mon planning · Crystal Pharm</title>
</svelte:head>

<div class="grid gap-6">
	<PageHeader title="Mon planning" context={data.firstName ? `Bonjour ${data.firstName}` : ''} icon="calendar-dots">
		{#snippet actions()}
			<Button variant="secondary" icon="clock" href={data.requestPanelHrefs.availability}>Signaler une indisponibilité</Button>
			<Button icon="sun" href={data.requestPanelHrefs.leave}>Demander un congé</Button>
		{/snippet}
	</PageHeader>

	{#if unreadNotices.length > 0}
		<Alert tone="info" title="Nouveau">
			<ul>
				{#each unreadNotices as notice (notice.id)}<li>{notice.message}</li>{/each}
			</ul>
		</Alert>
	{/if}

	{#if form && 'leaveConfirmation' in form}
		<Alert tone={form.isTeamSufficient ? 'success' : 'warning'} title="Demande envoyée">{form.leaveConfirmation}</Alert>
	{/if}

	<!-- La semaine comme une bande de sept tickets : aujourd'hui en sombre, les horaires en gros. -->
	<section aria-label="Ma semaine" class="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
		<header class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
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
				<p class="flex items-baseline gap-2 text-small text-ink-muted">
					<span class="font-display text-[28px] leading-8 text-ink tabular-nums">{data.plannedDurationLabel}</span>
					prévues
				</p>
			{/if}
		</header>

		{#if !data.isWeekPublished}
			<p class="px-5 py-10 text-center text-body text-ink-muted">
				Cette semaine est en préparation : votre titulaire ne l’a pas encore partagée.
			</p>
		{:else}
			<ol class="grid divide-dashed divide-line-strong/50 max-md:divide-y md:grid-cols-7 md:divide-x">
				{#each data.days as day (day.date)}
					<li
						class="grid content-start gap-3 px-4 py-4 max-md:grid-cols-[64px_1fr] max-md:items-center {day.isToday
							? 'bg-rail text-on-rail'
							: ''}"
						aria-current={day.isToday ? 'date' : undefined}
					>
						<p class="grid gap-0.5">
							<span class="text-eyebrow {day.isToday ? 'text-accent-on-rail' : 'text-ink-subtle'}">
								{day.isToday ? 'Aujourd’hui' : day.weekdayLabel}
							</span>
							<span class="font-display text-[32px] leading-9 tabular-nums {day.isToday ? 'text-on-rail' : 'text-ink'}">
								{day.dayOfMonth}
							</span>
						</p>
						<div class="grid gap-1.5">
							{#if day.absenceLabel}
								<span class="justify-self-start rounded-full bg-warning-soft px-2.5 py-0.5 text-small font-bold text-warning">
									{day.absenceLabel}
								</span>
							{:else if day.shiftLabels.length === 0}
								<span class="text-small {day.isToday ? 'text-rail-ink' : 'text-ink-subtle'}">Repos</span>
							{:else}
								{#each day.shiftLabels as shiftLabel}
									<span
										class="justify-self-start rounded-md px-2 py-1 text-[15px] leading-5 font-bold tabular-nums {day.isToday
											? 'bg-rail-raised text-on-rail'
											: 'bg-accent-soft text-accent-text'}"
									>
										{shiftLabel}
									</span>
								{/each}
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	</section>

	<div class="grid gap-6 lg:grid-cols-2">
		<section class="grid content-start gap-3" aria-labelledby="my-leaves-title">
			<div class="flex items-baseline justify-between gap-3">
				<h2 id="my-leaves-title" class={sectionTitleClasses}>Mes congés</h2>
				<Button variant="ghost" size="compact" icon="plus" href={data.requestPanelHrefs.leave}>Demander</Button>
			</div>
			<MyLeaveList leaves={data.leaves} cancelFormAction={data.cancelLeaveFormAction} />
		</section>

		<section class="grid content-start gap-3" aria-labelledby="my-availabilities-title">
			<div class="flex items-baseline justify-between gap-3">
				<h2 id="my-availabilities-title" class={sectionTitleClasses}>Mes indisponibilités</h2>
				<Button variant="ghost" size="compact" icon="plus" href={data.requestPanelHrefs.availability}>Signaler</Button>
			</div>
			<MyAvailabilityRuleList rules={data.rules} removeFormAction={data.removeAvailabilityFormAction} />
		</section>
	</div>
</div>

{#if isLeavePanelOpen}
	<SidePanel title="Demander un congé" closeHref={data.requestPanelHrefs.closed}>
		<div class="grid gap-5">
			<p class="text-small text-ink-muted">
				Votre titulaire reçoit la demande, voit tout de suite s’il reste assez de monde, et l’accepte ou la refuse.
			</p>
			<LeaveRequestForm
				formAction={data.requestLeaveFormAction}
				leaveKinds={data.requestableLeaveKinds}
				defaultDate={data.todayDate}
				errorMessage={leaveFailure?.leaveMessage}
				submittedValues={leaveFailure?.leaveValues}
			/>
		</div>
	</SidePanel>
{:else if isAvailabilityPanelOpen}
	<SidePanel title="Signaler une indisponibilité" closeHref={data.requestPanelHrefs.closed}>
		<div class="grid gap-5">
			<p class="text-small text-ink-muted">
				{data.isAvailabilityAutomaticallyValidated
					? 'Votre demande est prise en compte tout de suite.'
					: 'Votre titulaire reçoit la demande et l’accepte ou la refuse.'}
			</p>
			<AvailabilityRequestForm
				formAction={data.addAvailabilityFormAction}
				errorMessage={availabilityFailure?.message}
				submittedValues={availabilityFailure?.values}
			/>
		</div>
	</SidePanel>
{/if}
