<script lang="ts">
	import { PersonLabel, StatusBadge } from '@crystal-pharm/ui';
	import type { TodayNow } from '../../pages/tools-home/toolsHomePageData';

	let { now }: { now: TodayNow } = $props();
</script>

<section aria-labelledby="maintenant-titre" class="grid gap-5 rounded-lg border border-line bg-surface p-5 shadow-card">
	<div class="flex items-baseline justify-between gap-3">
		<h2 id="maintenant-titre" class="text-label tracking-[.04em] text-ink-subtle uppercase">Maintenant</h2>
		<span class="text-small text-ink-subtle tabular-nums">{now.timeLabel}</span>
	</div>

	<div class="grid gap-6 sm:grid-cols-2">
		{#if now.presentPeople}
			<div class="grid content-start gap-2.5" data-module="planning">
				<p class="text-small text-ink-muted">Au comptoir</p>
				{#each now.presentPeople as person (person.key)}
					<PersonLabel name={person.name} detail={person.detail} />
				{:else}
					<p class="text-body text-ink-subtle">Personne en ce moment.</p>
				{/each}
				{#if now.isPharmacistMissing}
					<span><StatusBadge tone="danger">Aucun pharmacien</StatusBadge></span>
				{/if}
			</div>
		{/if}

		{#if now.nextAppointment !== undefined}
			<div class="grid content-start gap-1.5" data-module="rdv">
				<p class="text-small text-ink-muted">Prochain rendez-vous</p>
				{#if now.nextAppointment}
					<a href={now.nextAppointment.href} class="group grid gap-1 no-underline">
						<span class="flex flex-wrap items-baseline gap-x-2.5">
							<span class="text-kpi text-ink tabular-nums">{now.nextAppointment.startTime}</span>
							<span class="text-[15px] leading-5 font-medium text-ink group-hover:underline">{now.nextAppointment.reason}</span>
						</span>
						<span class="text-small text-ink-subtle">{now.nextAppointment.detail}</span>
					</a>
					{#if now.nextAppointment.isPending}
						<span><StatusBadge tone="warning">À confirmer</StatusBadge></span>
					{/if}
				{:else}
					<p class="text-body text-ink-subtle">Plus de rendez-vous aujourd’hui.</p>
				{/if}
			</div>
		{/if}
	</div>

	{#if now.summary}
		<p class="text-body border-t border-line-soft pt-3.5 text-ink-muted">{now.summary}</p>
	{/if}
</section>
