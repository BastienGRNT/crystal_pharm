<script lang="ts">
	import { Button, DataTable, PersonLabel, StatusBadge, Tag } from '@crystal-pharm/ui';
	import type { AppointmentRow } from '../../pages/appointmentsPageData';

	let { rows }: { rows: AppointmentRow[] } = $props();
</script>

<DataTable caption="Rendez-vous">
	{#snippet head()}
		<th scope="col">Horaire</th>
		<th scope="col">Patient</th>
		<th scope="col" class="max-sm:hidden">Motif</th>
		<th scope="col" class="max-md:hidden">Avec</th>
		<th scope="col" class="max-sm:hidden">Statut</th>
		<th scope="col"><span class="sr-only">Action</span></th>
	{/snippet}
	{#each rows as row (row.id)}
		<tr class={row.isCancelled ? 'text-ink-subtle' : undefined}>
			<td class="whitespace-nowrap tabular-nums">
				<span class="block font-semibold">{row.startTime}</span>
				<span class="block text-small text-ink-subtle">jusqu’à {row.endTime}</span>
			</td>
			<td>
				<a href={row.href} class="-m-1 block rounded-xs p-1 no-underline hover:[&_b]:underline">
					<PersonLabel name={row.patientName} detail={row.patientPhone} />
				</a>
				<span class="mt-1.5 block sm:hidden"><StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge></span>
			</td>
			<td class="max-sm:hidden"><Tag>{row.reason}</Tag></td>
			<td class="whitespace-nowrap text-ink-muted max-md:hidden">{row.employeeName}</td>
			<td class="max-sm:hidden"><StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge></td>
			<td class="text-right">
				{#if row.quickConfirm}
					<form method="POST" action={row.quickConfirm.formAction}>
						<input type="hidden" name="appointmentId" value={row.id} />
						{#if row.quickConfirm.notifiesByEmail}
							<input type="hidden" name="notifyByEmail" value="on" />
						{/if}
						<Button type="submit" variant="secondary" icon={row.quickConfirm.notifiesByEmail ? 'envelope-simple' : 'check'}>
							<span class="max-sm:sr-only">Confirmer</span>
						</Button>
					</form>
				{/if}
			</td>
		</tr>
	{/each}
</DataTable>
