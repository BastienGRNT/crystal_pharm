<script lang="ts">
	import type { GroupArticle, GroupArticleFieldName, GroupArticleInput } from '@crystal-pharm/group-db/domain';
	import type { FieldErrors } from '@crystal-pharm/pharmacy-db/domain';
	import { Button, ConfirmButton } from '@crystal-pharm/ui';
	import { formatCalendarDay } from '$lib/dateFormats';
	import { untrack } from 'svelte';
	import GroupArticleForm from './GroupArticleForm.svelte';

	type RefusedArticleUpdate = { articleId: string; submittedArticle: GroupArticleInput; fieldErrors: FieldErrors<GroupArticleFieldName> };

	type GroupArticleListProps = {
		articles: GroupArticle[];
		/** Une modification refusée reste ouverte, avec ce qui avait été saisi. */
		refusedUpdate?: RefusedArticleUpdate;
	};

	let { articles, refusedUpdate }: GroupArticleListProps = $props();

	let editedArticleId: string | undefined = $state(untrack(() => refusedUpdate?.articleId));
</script>

<ul class="grid">
	{#each articles as article (article.articleId)}
		<li class="grid gap-3 border-t border-line-soft py-4 first:border-t-0 first:pt-0 last:pb-0">
			{#if editedArticleId === article.articleId}
				{@const isRefused = refusedUpdate?.articleId === article.articleId}
				<GroupArticleForm
					action="?/updateArticle"
					articleId={article.articleId}
					initialArticle={isRefused && refusedUpdate ? refusedUpdate.submittedArticle : article}
					fieldErrors={isRefused ? refusedUpdate?.fieldErrors : undefined}
					submitLabel="Enregistrer"
					oncancel={() => (editedArticleId = undefined)}
				/>
			{:else}
				<div class="grid gap-1">
					<p class="body-strong text-ink">{article.title}</p>
					<p class="text-small text-ink-subtle">Publiée le {formatCalendarDay(article.publishedAt)}</p>
					<p class="text-body whitespace-pre-line text-ink-muted">{article.summary}</p>
				</div>
				<form method="POST" class="flex flex-wrap gap-2">
					<input type="hidden" name="articleId" value={article.articleId} />
					<Button variant="secondary" icon="pencil-simple" onclick={() => (editedArticleId = article.articleId)}>Modifier</Button>
					<ConfirmButton
						label="Supprimer"
						icon="trash"
						variant="ghost"
						title="Supprimer cette actualité ?"
						description="Elle disparaîtra du site de toutes vos pharmacies qui affichent vos actualités."
						confirmLabel="Supprimer"
						isDestructive
						formaction="?/deleteArticle"
					/>
				</form>
			{/if}
		</li>
	{/each}
</ul>
