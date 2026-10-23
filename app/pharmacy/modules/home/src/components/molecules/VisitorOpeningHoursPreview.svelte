<script lang="ts">
	import type { WeeklyOpeningSchedule } from '@crystal-pharm/pharmacy-db/domain';
	import { Icon } from '@crystal-pharm/ui';
	import { describeOpeningHoursForVisitor } from '../../domain/visitorOpeningHours';

	type VisitorOpeningHoursPreviewProps = {
		/** `undefined` tant que la saisie a une erreur : rien de juste à montrer. */
		weeklyOpeningSchedule: WeeklyOpeningSchedule | undefined;
	};

	let { weeklyOpeningSchedule }: VisitorOpeningHoursPreviewProps = $props();

	// Le site sépare les plages d'un même jour ainsi.
	const openingPeriodSeparator = ' / ';
	const visitorOpeningDays = $derived(weeklyOpeningSchedule ? describeOpeningHoursForVisitor(weeklyOpeningSchedule) : []);
</script>

<figure class="grid gap-3 rounded-lg border border-line bg-surface-subtle p-5">
	<figcaption class="flex items-center gap-1.5 text-small font-medium text-ink-muted">
		<Icon name="globe-simple" size={16} />
		Ce que voient vos patients
	</figcaption>

	<div class="grid gap-2 rounded-md border border-line bg-surface p-4 shadow-card">
		<p class="body-strong text-ink">Horaires d’ouverture</p>
		{#if weeklyOpeningSchedule}
			<table class="w-full text-small">
				<tbody>
					{#each visitorOpeningDays as visitorOpeningDay (visitorOpeningDay.weekdayLabel)}
						<tr>
							<th scope="row" class="py-1 pr-4 text-left align-top font-normal text-ink-muted">
								{visitorOpeningDay.weekdayLabel}
							</th>
							<td class="py-1 align-top whitespace-nowrap tabular-nums {visitorOpeningDay.isClosed ? 'text-ink-muted' : 'text-ink'}">
								{visitorOpeningDay.isClosed ? 'Fermé' : visitorOpeningDay.openingPeriodLabels.join(openingPeriodSeparator)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="text-small text-ink-muted">Corrigez les horaires signalés pour voir l’aperçu.</p>
		{/if}
	</div>

	<p class="text-small text-ink-muted">Mis à jour sur votre site dès l’enregistrement.</p>
</figure>
