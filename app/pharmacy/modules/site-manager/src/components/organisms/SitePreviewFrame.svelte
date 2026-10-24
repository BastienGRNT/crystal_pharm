<script lang="ts">
	import { Button, ChoiceGroup } from '@crystal-pharm/ui';
	import { isPreviewReadyMessage, toPreviewUpdateMessage, type PreviewUpdateMessage } from '../../domain/previewMessages';
	import type { TenantSiteInput } from '../../domain/siteDraft';

	type SitePreviewFrameProps = {
		frameUrl: string;
		frameOrigin: string;
		/** Absent tant que les réglages en cours ne sont pas valides : l'aperçu garde alors le dernier site valide. */
		tenantSite: TenantSiteInput | undefined;
	};

	let { frameUrl, frameOrigin, tenantSite }: SitePreviewFrameProps = $props();

	const deviceOptions = [
		{ value: 'desktop', label: 'Ordinateur' },
		{ value: 'mobile', label: 'Mobile' }
	];
	// Un seul onglet d'aperçu à la fois : le rouvrir le recharge au lieu d'en ouvrir un autre.
	const detachedPreviewName = 'crystal-pharm-site-preview';

	let frame: HTMLIFrameElement | undefined = $state();
	let previewArea: HTMLDivElement | undefined = $state();
	let device = $state('desktop');
	let isFrameReady = $state(false);
	let isFrameSlow = $state(false);
	let isFullscreen = $state(false);
	const slowFrameDelayInMilliseconds = 15_000;
	// Les aperçus prêts à recevoir le site : l'iframe et, s'il est ouvert, l'onglet en grand.
	const readyPreviewWindows = new Set<Window>();
	let detachedPreviewWindow: Window | null = null;

	function isPreviewWindow(source: MessageEventSource | null): source is Window {
		return source !== null && (source === frame?.contentWindow || source === detachedPreviewWindow);
	}

	function sendToPreviewWindow(previewWindow: Window, message: PreviewUpdateMessage): void {
		if (previewWindow.closed) readyPreviewWindows.delete(previewWindow);
		else previewWindow.postMessage(message, frameOrigin);
	}

	$effect(() => {
		function receivePreviewMessage(event: MessageEvent): void {
			if (event.origin !== frameOrigin || !isPreviewReadyMessage(event.data) || !isPreviewWindow(event.source)) return;
			readyPreviewWindows.add(event.source);
			if (event.source === frame?.contentWindow) isFrameReady = true;
			if (tenantSite) sendToPreviewWindow(event.source, toPreviewUpdateMessage($state.snapshot(tenantSite)));
		}
		window.addEventListener('message', receivePreviewMessage);
		return () => window.removeEventListener('message', receivePreviewMessage);
	});

	// Une frappe au clavier ne déclenche qu'un rendu par image affichée, pas un par caractère.
	$effect(() => {
		if (!tenantSite) return;
		const message = toPreviewUpdateMessage($state.snapshot(tenantSite));
		const animationFrame = requestAnimationFrame(() => {
			for (const previewWindow of readyPreviewWindows) sendToPreviewWindow(previewWindow, message);
		});
		return () => cancelAnimationFrame(animationFrame);
	});

	$effect(() => {
		const followFullscreen = () => (isFullscreen = document.fullscreenElement === previewArea);
		document.addEventListener('fullscreenchange', followFullscreen);
		return () => document.removeEventListener('fullscreenchange', followFullscreen);
	});

	// Un aperçu qui ne répond pas est signalé, avec de quoi réessayer, au lieu de charger sans fin.
	$effect(() => {
		if (isFrameReady) return;
		const slowFrameTimeout = setTimeout(() => (isFrameSlow = true), slowFrameDelayInMilliseconds);
		return () => clearTimeout(slowFrameTimeout);
	});

	function reloadFrame(): void {
		isFrameReady = false;
		isFrameSlow = false;
		if (frame) frame.src = frameUrl;
	}

	function openDetachedPreview(): void {
		detachedPreviewWindow = window.open(frameUrl, detachedPreviewName);
	}

	function toggleFullscreen(): void {
		if (document.fullscreenElement) void document.exitFullscreen();
		else void previewArea?.requestFullscreen();
	}
</script>

<section class="grid gap-3 xl:sticky xl:top-6" aria-label="Aperçu du site">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h2 class="title-2 text-ink">Aperçu</h2>
		<div class="flex flex-wrap items-center gap-2">
			<ChoiceGroup name="previewDevice" legend="Taille de l’aperçu" options={deviceOptions} bind:value={device} />
			<Button variant="secondary" onclick={toggleFullscreen}>Plein écran</Button>
			<Button variant="secondary" icon="arrow-square-out" onclick={openDetachedPreview}>Ouvrir en grand</Button>
		</div>
	</div>
	<div
		bind:this={previewArea}
		class="relative flex flex-col overflow-hidden bg-surface-muted {isFullscreen ? '' : 'rounded-lg border border-line shadow-card'}"
	>
		{#if isFullscreen}
			<div class="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2">
				<ChoiceGroup name="fullscreenPreviewDevice" legend="Taille de l’aperçu" options={deviceOptions} bind:value={device} />
				<Button variant="secondary" icon="x" onclick={toggleFullscreen}>Quitter le plein écran</Button>
			</div>
		{/if}
		<iframe
			bind:this={frame}
			src={frameUrl}
			title="Aperçu du site"
			class="mx-auto block w-full bg-surface {isFullscreen ? 'min-h-0 flex-1' : 'h-[720px]'} {device === 'mobile'
				? 'max-w-[390px]'
				: ''}"
		></iframe>
		{#if !isFrameReady}
			<div class="absolute inset-0 grid place-items-center bg-surface p-6">
				{#if isFrameSlow}
					<div class="grid justify-items-center gap-3 text-center">
						<p class="text-small text-ink-muted">L’aperçu ne répond pas. Vos modifications ne sont pas perdues.</p>
						<Button variant="secondary" onclick={reloadFrame}>Réessayer</Button>
					</div>
				{:else}
					<p class="text-small text-ink-muted">Chargement de l’aperçu…</p>
				{/if}
			</div>
		{/if}
	</div>
</section>
