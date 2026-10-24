<script lang="ts">
	import {
		maximumGroupArticleSummaryLength,
		maximumGroupArticleTitleLength,
		type GroupArticleFieldName,
		type GroupArticleInput
	} from '@crystal-pharm/group-db/domain';
	import { wholeFormErrorKey, type FieldErrors } from '@crystal-pharm/pharmacy-db/domain';
	import { Alert, Button, DatePicker, Field, Input, Textarea } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';

	type GroupArticleFormProps = {
		/** L'action SvelteKit visée (`?/createArticle`…). */
		action: string;
		/** Absent pour une nouvelle actualité. */
		articleId?: string;
		initialArticle: GroupArticleInput;
		fieldErrors?: FieldErrors<GroupArticleFieldName>;
		submitLabel: string;
		oncancel?: () => void;
	};

	let { action, articleId, initialArticle, fieldErrors = {}, submitLabel, oncancel }: GroupArticleFormProps = $props();

	const article = $state(untrack(() => ({ ...initialArticle })));
</script>

<form method="POST" {action} class="grid gap-4">
	{#if articleId}<input type="hidden" name="articleId" value={articleId} />{/if}
	{#if fieldErrors[wholeFormErrorKey]}<Alert tone="danger">{fieldErrors[wholeFormErrorKey]}</Alert>{/if}

	<Field label="Titre" errorMessage={fieldErrors.title}>
		{#snippet control(controlAttributes)}
			<Input
				{...controlAttributes}
				name="title"
				required
				maxlength={maximumGroupArticleTitleLength}
				placeholder="-10 % sur la parapharmacie"
				bind:value={article.title}
			/>
		{/snippet}
	</Field>
	<Field label="Résumé" errorMessage={fieldErrors.summary}>
		{#snippet control(controlAttributes)}
			<Textarea {...controlAttributes} name="summary" required rows={4} maxlength={maximumGroupArticleSummaryLength} bind:value={article.summary} />
		{/snippet}
	</Field>
	<Field label="Date de publication" errorMessage={fieldErrors.publishedAt}>
		{#snippet control(controlAttributes)}
			<DatePicker id={controlAttributes.id} name="publishedAt" bind:value={article.publishedAt} />
		{/snippet}
	</Field>

	<div class="flex flex-wrap gap-2">
		<Button type="submit" icon="check">{submitLabel}</Button>
		{#if oncancel}<Button variant="ghost" onclick={oncancel}>Annuler</Button>{/if}
	</div>
</form>
