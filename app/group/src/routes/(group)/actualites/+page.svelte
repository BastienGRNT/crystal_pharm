<script lang="ts">
	import { page } from '$app/state';
	import { Alert, Button, Card, EmptyState, PageHeader, SidePanel } from '@crystal-pharm/ui';
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

<div class="grid w-full max-w-3xl gap-3.5">
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
		{#if data.articles.length > 0}
			<Card>
				<div class="grid gap-4">
					<h2 class="title-2 text-ink">Publiées</h2>
					<GroupArticleList articles={data.articles} {refusedUpdate} />
				</div>
			</Card>
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

		<GroupNewsImpositionForm imposesGroupNews={data.imposesGroupNews} />

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
