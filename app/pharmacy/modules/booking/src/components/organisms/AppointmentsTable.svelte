<script lang="ts">
	import { DataTable, PersonLabel, StatusBadge, Tag } from '@crystal-pharm/ui';
	import type { AppointmentRow } from '../../pages/appointmentsPageData';

	let { rows }: { rows: AppointmentRow[] } = $props();
</script>

<DataTable caption="Rendez-vous">
	{#snippet head()}
		<th scope="col">Horaire</th>
		<th scope="col">Patient</th>
		<th scope="col" class="max-sm:hidden">Motif</th>
		<th scope="col" class="max-md:hidden">Avec</th>
		<th scope="col">Statut</th>
	{/snippet}
	{#each rows as row (row.id)}
		<tr class={row.isCancelled ? 'text-ink-subtle' : undefined}>
			<td class="font-semibold whitespace-nowrap tabular-nums">{row.hours}</td>
			<td>
				<a href={row.href} class="-m-1 block rounded-xs p-1 no-underline hover:[&_b]:underline">
					<PersonLabel name={row.patientName} detail={row.patientPhone} />
				</a>
			</td>
			<td class="max-sm:hidden"><Tag>{row.reason}</Tag></td>
			<td class="whitespace-nowrap text-ink-muted max-md:hidden">{row.employeeName}</td>
			<td><StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge></td>
		</tr>
	{/each}
</DataTable>
