<script lang="ts">
	import { Button } from '@crystal-pharm/ui';
	import { isPreviewReadyMessage, toPreviewUpdateMessage, type PreviewUpdateMessage } from '../../domain/previewMessages';
	import type { TenantSiteInput } from '../../domain/siteDraft';

	type SitePreviewFrameProps = {
		frameUrl: string;
		frameOrigin: string;
		/** Absent tant que les réglages en cours ne sont pas valides : l'aperçu garde alors le dernier site valide. */
		tenantSite: TenantSiteInput | undefined;
	};

	let { frameUrl, frameOrigin, tenantSite }: SitePreviewFrameProps = $props();

	let frame: HTMLIFrameElement | undefined = $state();
	let isFrameReady = $state(false);
	let isFrameSlow = $state(false);
	const slowFrameDelayInMilliseconds = 15_000;

	function sendToPreview(message: PreviewUpdateMessage): void {
		frame?.contentWindow?.postMessage(message, frameOrigin);
	}

	$effect(() => {
		function receivePreviewMessage(event: MessageEvent): void {
			if (event.origin !== frameOrigin || !isPreviewReadyMessage(event.data) || event.source !== frame?.contentWindow) return;
			isFrameReady = true;
			if (tenantSite) sendToPreview(toPreviewUpdateMessage($state.snapshot(tenantSite)));
		}
		window.addEventListener('message', receivePreviewMessage);
		return () => window.removeEventListener('message', receivePreviewMessage);
	});

	// Une frappe au clavier ne déclenche qu'un rendu par image affichée, pas un par caractère.
	$effect(() => {
		if (!tenantSite) return;
		const message = toPreviewUpdateMessage($state.snapshot(tenantSite));
		const animationFrame = requestAnimationFrame(() => {
			if (isFrameReady) sendToPreview(message);
		});
		return () => cancelAnimationFrame(animationFrame);
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
</script>

<section
	class="relative h-[720px] overflow-hidden rounded-lg border border-line bg-surface shadow-card lg:fixed lg:inset-y-0 lg:right-0 lg:z-10 lg:h-dvh lg:w-[45vw] lg:rounded-none lg:border-y-0 lg:border-r-0 lg:shadow-none"
	aria-label="Aperçu du site"
>
	<iframe bind:this={frame} src={frameUrl} title="Aperçu du site" class="block size-full bg-surface"></iframe>
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
</section>
