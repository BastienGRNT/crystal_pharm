<script lang="ts">
	import type { NewsModuleData } from '@crystal-pharm/schema';

	type GroupArticleListProps = {
		groupName: string;
		articles: NewsModuleData['articles'];
	};

	let { groupName, articles }: GroupArticleListProps = $props();

	const calendarDayFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' });

	// Midi UTC : le même jour à Paris, été comme hiver.
	function formatCalendarDay(calendarDay: string): string {
		return calendarDayFormat.format(new Date(`${calendarDay}T12:00:00Z`));
	}
</script>

{#if articles.length === 0}
	<p class="text-small text-ink-muted">{groupName} n’a encore publié aucune actualité : le bloc reste masqué sur votre site.</p>
{:else}
	<div class="grid gap-3">
		<p class="text-small text-ink-muted">Écrites par {groupName}, elles se mettent à jour toutes seules.</p>
		{#each articles as article, articleIndex (articleIndex)}
			<div class="grid gap-1 rounded-md border border-line p-3">
				<p class="body-strong text-ink">{article.title}</p>
				<p class="text-small text-ink-muted">{formatCalendarDay(article.publishedAt)}</p>
				<p class="text-body text-ink">{article.summary}</p>
			</div>
		{/each}
	</div>
{/if}
