<script lang="ts">
	import { Icon } from '@crystal-pharm/ui';
	import type { TodayFigure, TodayNow, TodayOnDuty } from '../../pages/tools-home/toolsHomePageData';

	type TodayBoardProps = {
		now: TodayNow;
		figures: TodayFigure[];
		onDuty: TodayOnDuty | undefined;
	};

	let { now, figures, onDuty }: TodayBoardProps = $props();

	const figureDetailClasses = { neutral: 'text-rail-ink', warning: 'font-bold text-warning-on-rail', danger: 'font-bold text-danger-on-rail' };
</script>

<!-- Le tableau du comptoir : sombre comme l'enseigne, pour qu'on le trouve d'un regard en arrivant. -->
<section aria-labelledby="maintenant-titre" class="overflow-hidden rounded-xl bg-rail text-on-rail shadow-float">
	{#if onDuty?.isSoon}
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-dashed border-rail-raised px-6 py-3 max-sm:px-4">
			<Icon name="moon" size={20} class="flex-none text-accent-on-rail" />
			<p class="min-w-0 flex-1 text-small text-rail-ink">
				<strong class="font-bold text-on-rail">{onDuty.title}</strong> · {onDuty.detail} · affichée sur votre site
			</p>
			{#if onDuty.href}
				<a href={onDuty.href} class="inline-flex items-center gap-1 text-small font-bold text-accent-on-rail no-underline hover:underline">
					Voir les gardes <Icon name="arrow-right" size={14} />
				</a>
			{/if}
		</div>
	{/if}

	<div class="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
		<div class="grid content-start gap-5 px-6 py-5 max-sm:px-4">
			<div class="flex items-baseline justify-between gap-3">
				<h2 id="maintenant-titre" class="text-eyebrow text-rail-ink">Maintenant</h2>
				<span class="font-display text-[30px] leading-8 tabular-nums">{now.timeLabel}</span>
			</div>

			{#if now.presentPeople}
				<div class="grid gap-2">
					<p class="text-small text-rail-ink">Au comptoir</p>
					<ul class="flex flex-wrap gap-1.5">
						{#each now.presentPeople as person (person.key)}
							<li class="rounded-full bg-rail-raised px-3 py-1 text-small">
								<b class="font-bold">{person.name}</b> <span class="text-rail-ink">· {person.detail}</span>
							</li>
						{:else}
							<li class="text-body text-rail-ink">Personne en ce moment.</li>
						{/each}
					</ul>
					{#if now.isPharmacistMissing}
						<p class="flex items-center gap-1.5 text-small font-bold text-danger-on-rail">
							<Icon name="warning" size={16} /> Aucun pharmacien en ce moment
						</p>
					{/if}
				</div>
			{/if}

			{#if now.nextAppointment !== undefined}
				<div class="grid gap-1">
					<p class="text-small text-rail-ink">Prochain rendez-vous</p>
					{#if now.nextAppointment}
						<a href={now.nextAppointment.href} class="group flex flex-wrap items-baseline gap-x-3 no-underline">
							<span class="font-display text-[24px] leading-7 tabular-nums">{now.nextAppointment.startTime}</span>
							<span class="font-bold group-hover:underline">{now.nextAppointment.reason}</span>
							<span class="text-small text-rail-ink">{now.nextAppointment.detail}</span>
							{#if now.nextAppointment.isPending}
								<span class="text-small font-bold text-warning-on-rail">À confirmer</span>
							{/if}
						</a>
					{:else}
						<p class="text-body text-rail-ink">Plus de rendez-vous aujourd’hui.</p>
					{/if}
				</div>
			{/if}
		</div>

		{#if figures.length > 0}
			<ul
				aria-label="En chiffres"
				class="grid border-rail-raised max-lg:border-t max-lg:border-dashed sm:grid-cols-3 lg:border-l lg:border-dashed"
			>
				{#each figures as figure (figure.key)}
					<li class="grid border-rail-raised not-first:border-dashed max-sm:not-first:border-t sm:not-first:border-l">
						<!-- Sur un téléphone, le chiffre passe à gauche de son intitulé : les trois tiennent dans l'écran avec « À traiter ». -->
						<a
							href={figure.href}
							class="group grid content-start gap-4 px-5 py-5 no-underline transition-colors duration-[120ms] hover:bg-rail-raised max-sm:grid-cols-[3.25rem_minmax(0,1fr)] max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-1 max-sm:px-4 max-sm:py-3.5"
						>
							<span class="flex min-h-8 items-start gap-1.5 text-eyebrow text-rail-ink max-sm:col-start-2 max-sm:row-start-1 max-sm:min-h-0">
								<Icon name={figure.icon} size={16} class="flex-none" />
								<span class="flex-1">{figure.label}</span>
								<Icon name="arrow-right" size={14} class="flex-none transition-transform duration-[120ms] group-hover:translate-x-0.5" />
							</span>
							<span class="grid gap-1 max-sm:contents">
								<span class="font-display text-[46px] leading-[48px] tabular-nums max-sm:col-start-1 max-sm:row-span-2 max-sm:row-start-1 max-sm:text-[38px] max-sm:leading-[42px]">{figure.value}</span>
								<span class="text-small {figureDetailClasses[figure.detailTone]} max-sm:col-start-2 max-sm:row-start-2">{figure.detail}</span>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if now.summary}
		<p class="border-t border-dashed border-rail-raised px-6 py-3 text-small text-rail-ink max-sm:px-4">{now.summary}</p>
	{/if}
</section>
