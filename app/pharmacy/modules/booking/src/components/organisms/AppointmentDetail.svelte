<script lang="ts">
	import { Button, Checkbox, ConfirmButton, DescriptionList, PersonLabel, StatusBadge } from '@crystal-pharm/ui';
	import type { AppointmentDetailPanel } from '../../pages/appointmentsPageData';

	type AppointmentDetailProps = {
		detail: AppointmentDetailPanel;
		errorMessage?: string;
	};

	let { detail, errorMessage }: AppointmentDetailProps = $props();

	const hasAction = $derived(detail.confirmFormAction !== null || detail.cancelFormAction !== null);
</script>

<div class="grid gap-5">
	<div class="flex items-center justify-between gap-3">
		<PersonLabel name={detail.patientName} />
		<StatusBadge tone={detail.statusTone}>{detail.statusLabel}</StatusBadge>
	</div>

	<DescriptionList items={detail.items} />

	{#if errorMessage}
		<p role="alert" class="text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
	{/if}

	{#if hasAction}
		<!-- Un seul formulaire : la case « prévenir » vaut pour la confirmation comme pour l'annulation. -->
		<form method="POST" action={detail.confirmFormAction ?? detail.cancelFormAction} class="grid gap-3.5 border-t border-line pt-4">
			<input type="hidden" name="appointmentId" value={detail.appointmentId} />
			{#if detail.patientEmail}
				<Checkbox name="notifyByEmail" checked>
					Le prévenir par email
					<span class="block text-small text-ink-subtle">{detail.patientEmail} · le jour et l’heure, jamais le motif</span>
				</Checkbox>
			{:else}
				<p class="text-small text-ink-subtle">Pas d’email laissé : prévenez-le par téléphone.</p>
			{/if}
			<div class="flex flex-wrap gap-2">
				{#if detail.confirmFormAction}
					<Button type="submit" icon="check">Confirmer le rendez-vous</Button>
				{/if}
				{#if detail.cancelFormAction}
					<ConfirmButton
						label="Annuler le rendez-vous"
						icon="x"
						variant="ghost"
						title="Annuler ce rendez-vous ?"
						description="Le créneau redevient libre sur votre site."
						confirmLabel="Annuler le rendez-vous"
						formaction={detail.cancelFormAction}
						isDestructive
					/>
				{/if}
			</div>
		</form>
	{/if}
</div>
