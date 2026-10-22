<script lang="ts">
	import { Button, DescriptionList, PersonLabel, StatusBadge } from '@crystal-pharm/ui';
	import type { AppointmentDetailPanel } from '../pages/appointmentsPageData';

	type AppointmentDetailProps = {
		detail: AppointmentDetailPanel;
		errorMessage?: string;
	};

	let { detail, errorMessage }: AppointmentDetailProps = $props();
</script>

<div class="grid gap-5">
	<div class="flex items-center justify-between gap-3">
		<PersonLabel name={detail.patientName} initials={detail.patientInitials} />
		<StatusBadge tone={detail.statusTone}>{detail.statusLabel}</StatusBadge>
	</div>

	<DescriptionList items={detail.items} />

	{#if errorMessage}
		<p role="alert" class="text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
	{/if}

	{#if detail.confirmFormAction || detail.cancelFormAction}
		<div class="flex flex-wrap gap-2 border-t border-line pt-4">
			{#if detail.confirmFormAction}
				<form method="POST" action={detail.confirmFormAction}>
					<input type="hidden" name="appointmentId" value={detail.appointmentId} />
					<Button type="submit" icon="check">Confirmer</Button>
				</form>
			{/if}
			{#if detail.cancelFormAction}
				<form method="POST" action={detail.cancelFormAction}>
					<input type="hidden" name="appointmentId" value={detail.appointmentId} />
					<Button type="submit" variant="ghost" icon="x">Annuler le rendez-vous</Button>
				</form>
			{/if}
		</div>
	{/if}
</div>
