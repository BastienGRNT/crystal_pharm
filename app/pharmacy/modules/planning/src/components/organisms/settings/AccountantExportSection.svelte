<script lang="ts">
	import { Button, Field, Input } from '@crystal-pharm/ui';
	import type { AccountantExportFormValues } from '../../../pages/planningSettingsPageData';

	type AccountantExportSectionProps = {
		saveEmailFormAction: string;
		sendFormAction: string;
		values: AccountantExportFormValues;
		feedback?: { message: string; isFailure: boolean };
	};

	let { saveEmailFormAction, sendFormAction, values, feedback }: AccountantExportSectionProps = $props();
</script>

<div class="grid gap-6">
	<form method="POST" action={saveEmailFormAction} class="flex flex-wrap items-end gap-3">
		<div class="min-w-64 flex-1">
			<Field label="Email de l’expert-comptable" hint="Laissez vide pour ne rien envoyer.">
				{#snippet control(attributes)}
					<Input {...attributes} name="accountantEmail" type="email" autocomplete="off" value={values.accountantEmail} placeholder="cabinet@exemple.fr" />
				{/snippet}
			</Field>
		</div>
		<Button type="submit" variant="secondary" icon="check">Enregistrer</Button>
	</form>

	<form method="POST" action={sendFormAction} class="flex flex-wrap items-end gap-3">
		<div class="w-48">
			<Field label="Mois">
				{#snippet control(attributes)}
					<Input {...attributes} name="month" type="month" required max={values.latestMonth} value={values.defaultMonth} />
				{/snippet}
			</Field>
		</div>
		<Button type="submit" icon="paper-plane-tilt" disabled={values.accountantEmail === ''}>Envoyer maintenant</Button>
		<Button type="submit" variant="ghost" icon="download-simple" formaction={values.downloadAction}>Télécharger le CSV</Button>
	</form>

	{#if feedback}
		<p
			role={feedback.isFailure ? 'alert' : 'status'}
			class="text-[13px] leading-[18px] font-medium {feedback.isFailure ? 'text-danger' : 'text-success'}"
		>
			{feedback.message}
		</p>
	{/if}
</div>
