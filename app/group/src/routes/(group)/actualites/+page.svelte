<script lang="ts">
	import { page } from '$app/state';
	import { Alert, Button, EmptyState, PageHeader, SidePanel } from '@crystal-pharm/ui';
	import GroupArticleForm from '$lib/components/organisms/GroupArticleForm.svelte';
	import GroupArticleList from '$lib/components/organisms/GroupArticleList.svelte';
	import GroupNewsImpositionForm from '$lib/components/organisms/GroupNewsImpositionForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const refusedCreation = $derived(form && 'failedAction' in form && form.failedAction === 'createArticle' ? form : undefined);
	const refusedUpdate = $derived(form && 'failedAction' in form && form.failedAction === 'updateArticle' ? form : undefined);
	const succeededAction = $derived(form && 'succeededAction' in form ? form.succeededAction : undefined);

	const newArticleHref = '/actualites?nouvelle';
	// Le formulaire n'occupe l'écran que quand on écrit : la page montre d'abord ce qui est publié.
	const isNewArticlePanelOpen = $derived(page.url.searchParams.has('nouvelle') || refusedCreation !== undefined);

	const successMessages = {
		createArticle: 'L’actualité est publiée sur le site de vos pharmacies.',
		updateArticle: 'L’actualité est enregistrée.',
		deleteArticle: 'L’actualité est supprimée.',
		setImposition: 'Votre choix est enregistré.'
	} as const;
</script>

<svelte:head>
	<title>Actualités · Crystal Pharm</title>
</svelte:head>

<div class="grid gap-6">
	<PageHeader
		icon="sparkle"
		title="Actualités"
		context="Une promotion, une campagne : vos actualités, sur le site de toutes vos pharmacies membres."
	>
		{#snippet actions()}
			<Button href={newArticleHref} icon="plus">Nouvelle actualité</Button>
		{/snippet}
	</PageHeader>

	{#if succeededAction}<Alert tone="success">{successMessages[succeededAction]}</Alert>{/if}

	<!-- Après un envoi, chaque formulaire repart de ce qui vient d'être enregistré ou refusé. -->
	{#key form}
		<div class="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
			<section aria-labelledby="published-articles-title" class="grid gap-3">
				<h2 id="published-articles-title" class="flex items-baseline gap-2 font-display text-[21px] leading-7 text-ink">
					Publiées
					{#if data.articles.length > 0}<span class="font-sans text-small text-ink-subtle tabular-nums">{data.articles.length}</span>{/if}
				</h2>
				{#if data.articles.length > 0}
					<GroupArticleList articles={data.articles} {refusedUpdate} />
				{:else}
					<EmptyState
						icon="sparkle"
						title="Aucune actualité pour l’instant"
						description="Publiez-en une : elle apparaîtra sur le site des pharmacies qui affichent vos actualités."
					>
						{#snippet actions()}
							<Button href={newArticleHref} icon="plus">Écrire la première</Button>
						{/snippet}
					</EmptyState>
				{/if}
			</section>

			<aside aria-labelledby="news-diffusion-title" class="grid gap-3 lg:sticky lg:top-6">
				<h2 id="news-diffusion-title" class="font-display text-[21px] leading-7 text-ink">Diffusion</h2>
				<GroupNewsImpositionForm imposesGroupNews={data.imposesGroupNews} />
			</aside>
		</div>

		{#if isNewArticlePanelOpen}
			<SidePanel title="Nouvelle actualité" closeHref="/actualites">
				<GroupArticleForm
					action="?/createArticle"
					initialArticle={refusedCreation?.submittedArticle ?? { title: '', summary: '', publishedAt: data.today }}
					fieldErrors={refusedCreation?.fieldErrors}
					submitLabel="Publier"
				/>
			</SidePanel>
		{/if}
	{/key}
</div>
