<script lang="ts">
	import Button from '../atoms/actions/Button.svelte';

	type UnsavedChangesGuardProps = {
		hasUnsavedChanges: boolean;
	};

	let { hasUnsavedChanges }: UnsavedChangesGuardProps = $props();

	const componentId = $props.id();
	const titleId = `unsaved-title-${componentId}`;
	let dialogElement: HTMLDialogElement | undefined = $state();
	let blockedLink: HTMLAnchorElement | undefined;
	let isLeavingOnPurpose = false;

	function isInternalNavigation(link: HTMLAnchorElement, event: MouseEvent): boolean {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
		if (link.target === '_blank' || link.hasAttribute('download')) return false;
		const destination = new URL(link.href, location.href);
		const isSamePage = destination.pathname === location.pathname && destination.search === location.search;
		return destination.origin === location.origin && !isSamePage;
	}

	// Écouté avant le routeur de SvelteKit : un lien du menu ne doit pas emporter la saisie sans prévenir.
	function holdLinkWhileUnsaved(event: MouseEvent): void {
		if (!hasUnsavedChanges || isLeavingOnPurpose) return;
		const link = (event.target as Element | null)?.closest('a[href]');
		if (!(link instanceof HTMLAnchorElement) || !isInternalNavigation(link, event)) return;
		event.preventDefault();
		event.stopPropagation();
		blockedLink = link;
		dialogElement?.showModal();
	}

	// Envoyer le formulaire, c'est enregistrer : seul un envoi intercepté (`use:enhance`) laisse la page en place, et la garde se réarme.
	function allowSubmission(event: SubmitEvent): void {
		isLeavingOnPurpose = true;
		setTimeout(() => {
			if (event.defaultPrevented) isLeavingOnPurpose = false;
		});
	}

	function leaveAnyway(): void {
		dialogElement?.close();
		isLeavingOnPurpose = true;
		blockedLink?.click();
	}
</script>

<svelte:document onclickcapture={holdLinkWhileUnsaved} onsubmitcapture={allowSubmission} />
<svelte:window
	onbeforeunload={(event) => {
		if (hasUnsavedChanges && !isLeavingOnPurpose) event.preventDefault();
	}}
/>

<dialog
	bind:this={dialogElement}
	aria-labelledby={titleId}
	class="m-auto w-[min(440px,calc(100vw-32px))] rounded-lg border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-ink/40"
>
	<div class="grid gap-4 p-5">
		<div class="grid gap-1.5">
			<h2 id={titleId} class="title-2">Quitter sans enregistrer ?</h2>
			<p class="text-body text-ink-muted">Vos modifications seront perdues. Restez sur la page pour les enregistrer.</p>
		</div>
		<div class="flex flex-wrap justify-end gap-2">
			<Button variant="ghost" onclick={leaveAnyway}>Quitter quand même</Button>
			<Button onclick={() => dialogElement?.close()}>Rester sur la page</Button>
		</div>
	</div>
</dialog>
