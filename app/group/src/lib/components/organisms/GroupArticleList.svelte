<script lang="ts">
	import type { GroupArticle, GroupArticleFieldName, GroupArticleInput } from '@crystal-pharm/group-db/domain';
	import type { FieldErrors } from '@crystal-pharm/pharmacy-db/domain';
	import { Button, ConfirmButton } from '@crystal-pharm/ui';
	import { formatCalendarDay, splitCalendarDay } from '$lib/dateFormats';
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

<!-- Chaque actualité est un ticket : la date sur le talon, le texte à droite. -->
<ul class="grid gap-3">
	{#each articles as article (article.articleId)}
		{@const publicationDay = splitCalendarDay(article.publishedAt)}
		<li class="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
			{#if editedArticleId === article.articleId}
				{@const isRefused = refusedUpdate?.articleId === article.articleId}
				<div class="p-5">
					<GroupArticleForm
						action="?/updateArticle"
						articleId={article.articleId}
						initialArticle={isRefused && refusedUpdate ? refusedUpdate.submittedArticle : article}
						fieldErrors={isRefused ? refusedUpdate?.fieldErrors : undefined}
						submitLabel="Enregistrer"
						oncancel={() => (editedArticleId = undefined)}
					/>
				</div>
			{:else}
				<div class="grid grid-cols-[88px_minmax(0,1fr)]">
					<p class="relative grid content-center justify-items-center border-r-2 border-dashed border-line-strong/40 bg-accent-soft py-4 text-accent-text">
						<span aria-hidden="true" class="absolute -top-2 -right-2 size-4 rounded-full border border-line bg-app"></span>
						<span aria-hidden="true" class="absolute -right-2 -bottom-2 size-4 rounded-full border border-line bg-app"></span>
						<span class="font-display text-[34px] leading-9 tabular-nums">{publicationDay.dayOfMonth}</span>
						<span class="text-eyebrow">{publicationDay.shortMonth}</span>
						<span class="sr-only">Publiée le {formatCalendarDay(article.publishedAt)}</span>
					</p>
					<div class="grid gap-3 px-5 py-4">
						<div class="grid gap-1">
							<h3 class="font-display text-[21px] leading-7 text-ink">{article.title}</h3>
							<p class="text-body whitespace-pre-line text-ink-muted">{article.summary}</p>
						</div>
						<form method="POST" class="flex flex-wrap gap-1">
							<input type="hidden" name="articleId" value={article.articleId} />
							<Button variant="secondary" size="compact" icon="pencil-simple" onclick={() => (editedArticleId = article.articleId)}>Modifier</Button>
							<ConfirmButton
								label="Supprimer"
								icon="trash"
								variant="ghost"
								size="compact"
								title="Supprimer cette actualité ?"
								description="Elle disparaîtra du site de toutes vos pharmacies qui affichent vos actualités."
								confirmLabel="Supprimer"
								isDestructive
								formaction="?/deleteArticle"
							/>
						</form>
					</div>
				</div>
			{/if}
		</li>
	{/each}
</ul>
