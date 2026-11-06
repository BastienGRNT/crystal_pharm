<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Icon } from '@crystal-pharm/ui';
	import type { PrescriptionDocument } from '../../pages/receivedPrescriptionsPageData';

	/*
	 * Le fichier est lu depuis le stockage HDS par un lien pré-signé de 30 secondes, obtenu en arrière-plan, puis
	 * gardé en mémoire : le lien n'apparaît ni dans une barre d'adresse ni dans l'historique, et l'adresse `blob:`
	 * montrée ne vaut que dans cet onglet, tant qu'il est ouvert.
	 */

	type ReceivedDocumentCardProps = {
		receivedDocument: PrescriptionDocument;
		isWide: boolean;
	};

	let { receivedDocument, isWide }: ReceivedDocumentCardProps = $props();

	let fileAddressInMemory: string | undefined = $state();
	let hasFailed = $state(false);
	let pendingLoad: Promise<string> | undefined;

	onMount(() => {
		if (receivedDocument.isPreviewable) void loadFile().catch(() => undefined);
	});

	onDestroy(() => {
		if (fileAddressInMemory) URL.revokeObjectURL(fileAddressInMemory);
	});

	function loadFile(): Promise<string> {
		hasFailed = false;
		pendingLoad ??= loadFileIntoMemory().then(
			(fileAddress) => (fileAddressInMemory = fileAddress),
			(failure: unknown) => {
				pendingLoad = undefined;
				hasFailed = true;
				throw failure;
			}
		);
		return pendingLoad;
	}

	async function loadFileIntoMemory(): Promise<string> {
		const readLink = await fetchReadLink();
		const file = await fetchFileFromHealthStorage(readLink);
		return URL.createObjectURL(file);
	}

	async function fetchReadLink(): Promise<string> {
		const response = await fetch(receivedDocument.readLinkEndpoint, { cache: 'no-store', headers: { accept: 'application/json' } });
		if (!response.ok) throw new Error(`The read link was refused (${response.status}).`);
		const { url } = (await response.json()) as { url: string };
		return url;
	}

	async function fetchFileFromHealthStorage(readLink: string): Promise<Blob> {
		const response = await fetch(readLink, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
		if (!response.ok) throw new Error(`The health storage refused the file (${response.status}).`);
		return response.blob();
	}

	async function openInNewTab(): Promise<void> {
		// Ouvert au clic, avant d'attendre le fichier : un onglet ouvert après une attente serait bloqué par le navigateur.
		const newTab = window.open('', '_blank');
		try {
			const fileAddress = await loadFile();
			if (!newTab) return;
			newTab.opener = null;
			newTab.location.href = fileAddress;
		} catch {
			newTab?.close();
		}
	}
</script>

<button
	type="button"
	onclick={openInNewTab}
	class="group grid overflow-hidden rounded-lg border border-line bg-surface text-left shadow-card hover:border-line-strong {isWide ? 'sm:col-span-2' : ''}"
>
	{#if receivedDocument.isPreviewable && fileAddressInMemory}
		<img src={fileAddressInMemory} alt={receivedDocument.label} class="max-h-[420px] w-full bg-surface-muted object-contain" />
	{:else}
		<span class="grid h-28 place-items-center bg-surface-muted text-ink-subtle">
			{#if hasFailed}
				<span class="grid justify-items-center gap-1 text-small">
					<Icon name="warning" size={24} />
					Fichier indisponible, cliquez pour réessayer
				</span>
			{:else}
				<Icon name="file-text" size={32} />
			{/if}
		</span>
	{/if}
	<span class="flex items-center justify-between gap-2 border-t border-dashed border-line-strong/50 px-3.5 py-2.5 text-small font-bold text-ink">
		{receivedDocument.label}
		<span class="flex items-center gap-1 text-ink-subtle group-hover:text-ink">
			Ouvrir <Icon name="arrow-square-out" size={14} />
		</span>
	</span>
</button>
