<script lang="ts">
	import { Button, DatePicker, Field, IconButton, Input, Textarea } from '@crystal-pharm/ui';
	import { createEmptyArticleDraft, type ArticleDraft } from '../../domain/siteContentLists';

	type ArticleListEditorProps = {
		articles: ArticleDraft[];
		/** Appelé à l'ajout d'une actualité : la première rend le module affichable. */
		onarticleadded?: () => void;
	};

	let { articles = $bindable(), onarticleadded }: ArticleListEditorProps = $props();

	// La plus récente en haut, comme sur le site.
	function addArticle(): void {
		articles.unshift(createEmptyArticleDraft(new Date()));
		onarticleadded?.();
	}

	function removeArticle(article: ArticleDraft): void {
		articles.splice(articles.indexOf(article), 1);
	}

	function findMissingTextError(text: string, otherText: string, errorMessage: string): string | undefined {
		return text.trim() === '' && otherText.trim() !== '' ? errorMessage : undefined;
	}
</script>

<div class="grid gap-3">
	<div>
		<Button variant="secondary" icon="plus" onclick={addArticle}>Ajouter une actualité</Button>
	</div>
	{#each articles as article, articleIndex (article)}
		<div class="grid gap-3 rounded-md border border-line p-4">
			<div class="flex items-center justify-between gap-3">
				<p class="body-strong text-ink">Actualité {articleIndex + 1}</p>
				<IconButton icon="trash" label="Retirer cette actualité" onclick={() => removeArticle(article)} />
			</div>
			<Field label="Titre" errorMessage={findMissingTextError(article.title, article.summary, 'Donnez un titre à cette actualité.')}>
				{#snippet control(controlAttributes)}
					<Input {...controlAttributes} maxlength={160} placeholder="Campagne de vaccination contre la grippe" bind:value={article.title} />
				{/snippet}
			</Field>
			<Field label="Résumé" errorMessage={findMissingTextError(article.summary, article.title, 'Résumez cette actualité en quelques lignes.')}>
				{#snippet control(controlAttributes)}
					<Textarea {...controlAttributes} rows={4} maxlength={1200} bind:value={article.summary} />
				{/snippet}
			</Field>
			<Field label="Date de publication">
				{#snippet control(controlAttributes)}
					<DatePicker id={controlAttributes.id} name="articlePublishedAt" bind:value={article.publishedAt} />
				{/snippet}
			</Field>
		</div>
	{:else}
		<p class="text-small text-ink-muted">Aucune actualité pour l’instant : une campagne, un nouveau service, vos congés…</p>
	{/each}
</div>
