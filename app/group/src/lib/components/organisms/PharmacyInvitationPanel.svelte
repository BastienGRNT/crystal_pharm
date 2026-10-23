<script lang="ts">
	import { parseInvitationList } from '@crystal-pharm/group-db/domain';
	import { Alert, Button, Field, Icon, ProgressBar, SidePanel, Textarea } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';

	type PharmacyInvitationPanelProps = {
		closeHref: string;
		freePlaces: number;
		pharmacyQuota: number;
		initialList?: string;
		failureMessage?: string;
	};

	let { closeHref, freePlaces, pharmacyQuota, initialList = '', failureMessage }: PharmacyInvitationPanelProps = $props();

	let invitationList = $state(untrack(() => initialList));
	const parsedList = $derived(parseInvitationList(invitationList));
	const invitationCount = $derived(parsedList.entries.length);
	const isOverQuota = $derived(invitationCount > freePlaces);

	async function appendImportedFile(event: Event & { currentTarget: HTMLInputElement }): Promise<void> {
		const importedFile = event.currentTarget.files?.[0];
		if (!importedFile) return;
		const importedText = await importedFile.text();
		invitationList = [invitationList.trim(), importedText.trim()].filter(Boolean).join('\n');
		event.currentTarget.value = '';
	}
</script>

<SidePanel title="Inviter des pharmacies" {closeHref}>
	<form method="POST" action="?/invitePharmacies" class="grid gap-4">
		<p class="text-body text-ink-muted">
			Chaque titulaire reçoit un lien personnel, valable 14 jours. Il voit ce que vous prenez en charge, puis accepte que vous
			voyiez sa pharmacie : nom, ville et modules actifs, jamais ses patients.
		</p>

		<div class="grid gap-1.5 rounded-md bg-surface-subtle p-3">
			<p class="flex justify-between text-small">
				<span class="text-ink-muted">Places libres</span>
				<span class="font-semibold tabular-nums">{Math.max(freePlaces - invitationCount, 0)} sur {pharmacyQuota}</span>
			</p>
			<ProgressBar label="Places utilisées" value={pharmacyQuota - freePlaces + invitationCount} maximum={pharmacyQuota} />
		</div>

		<Field label="Emails des titulaires" hint="Un par ligne. Ajoutez le nom de la pharmacie après un « ; » si vous le connaissez.">
			{#snippet control(controlAttributes)}
				<Textarea
					{...controlAttributes}
					name="invitationList"
					rows={7}
					placeholder={'titulaire@pharmacie.fr\nPharmacie du Centre ; contact@pharmacie-centre.fr'}
					bind:value={invitationList}
				/>
			{/snippet}
		</Field>

		<label
			class="inline-flex cursor-pointer items-center gap-1.5 justify-self-start rounded-sm px-2 py-1 text-[13px] font-semibold text-accent-text hover:bg-surface-muted has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
		>
			<Icon name="upload-simple" size={16} />
			Importer un fichier CSV
			<input type="file" accept=".csv,.txt,text/csv,text/plain" class="sr-only" onchange={appendImportedFile} />
		</label>

		{#if invitationCount > 0}
			<ul class="grid max-h-40 gap-1 overflow-auto rounded-md border border-line p-2">
				{#each parsedList.entries as entry (entry.email)}
					<li class="flex items-center gap-2 text-small">
						<Icon name="check" size={14} class="text-success" />
						<span class="truncate">{entry.email}</span>
						{#if entry.pharmacyName}<span class="truncate text-ink-muted">· {entry.pharmacyName}</span>{/if}
					</li>
				{/each}
			</ul>
		{/if}
		{#if parsedList.unreadableLines.length > 0}
			<Alert tone="warning" title="Lignes sans email valide">{parsedList.unreadableLines.join(' · ')}</Alert>
		{/if}
		{#if isOverQuota}
			<Alert tone="warning">
				Vous dépassez votre quota de {invitationCount - freePlaces} pharmacie(s). Retirez des lignes, ou contactez Crystal Pharm pour l’augmenter.
			</Alert>
		{/if}
		{#if failureMessage}<Alert tone="danger">{failureMessage}</Alert>{/if}

		<Button type="submit" icon="paper-plane-tilt" isFullWidth disabled={invitationCount === 0 || isOverQuota || parsedList.unreadableLines.length > 0}>
			{invitationCount > 1 ? `Envoyer ${invitationCount} invitations` : 'Envoyer l’invitation'}
		</Button>
	</form>
</SidePanel>
