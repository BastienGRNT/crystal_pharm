<script lang="ts">
	import Button from '../atoms/actions/Button.svelte';
	import LogoMark from '../atoms/LogoMark.svelte';

	type ErrorScreenProps = {
		status: number;
		/** Le message levé par le serveur : affiché seulement pour un refus, jamais pour une panne. */
		message?: string;
		homeHref: string;
		/** Hors du cadre de l'app (une adresse inconnue) : l'écran porte alors le logo. */
		isFullPage?: boolean;
	};

	let { status, message, homeHref, isFullPage = false }: ErrorScreenProps = $props();

	const isRefusal = $derived(status === 400 || status === 401 || status === 403);

	const wording = $derived.by(() => {
		if (status === 404) {
			return { title: 'Cette page n’existe pas', description: 'Le lien est peut-être ancien, ou l’adresse a été mal recopiée.' };
		}
		if (isRefusal) {
			return { title: 'Accès réservé', description: message || 'Votre compte ne permet pas d’ouvrir cette page.' };
		}
		return {
			title: 'Un souci de notre côté',
			description: 'La page n’a pas pu s’afficher. Réessayez dans un instant ; si cela continue, écrivez-nous.'
		};
	});
</script>

<svelte:head>
	<title>{wording.title} · Crystal Pharm</title>
</svelte:head>

{#snippet content()}
	<div class="grid max-w-md justify-items-start gap-4">
		<p class="text-label tracking-[.04em] text-ink-subtle uppercase tabular-nums">Erreur {status}</p>
		<div class="grid gap-1.5">
			<h1 class="title-1 text-ink">{wording.title}</h1>
			<p class="text-body text-ink-muted">{wording.description}</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button href={homeHref} icon="house">Revenir à l’accueil</Button>
			{#if !isRefusal && status !== 404}
				<Button variant="secondary" icon="arrow-counter-clockwise" onclick={() => location.reload()}>Réessayer</Button>
			{/if}
		</div>
	</div>
{/snippet}

{#if isFullPage}
	<main class="grid min-h-dvh place-items-center bg-app px-6 font-sans text-ink">
		<div class="grid gap-8">
			<LogoMark size={36} surface="page" />
			{@render content()}
		</div>
	</main>
{:else}
	<section class="grid py-12 max-sm:py-6">
		{@render content()}
	</section>
{/if}
