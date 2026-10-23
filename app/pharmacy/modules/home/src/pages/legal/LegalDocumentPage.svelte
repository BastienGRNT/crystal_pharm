<script lang="ts">
	import { currentTermsVersion } from '@crystal-pharm/billing-db/domain';
	import { Alert, LogoMark } from '@crystal-pharm/ui';
	import { formatDay } from '../../dateFormats';
	import type { LegalDocument } from './legalDocuments';

	let { document }: { document: LegalDocument } = $props();
</script>

<svelte:head>
	<title>{document.title} · Crystal Pharm</title>
</svelte:head>

<main class="mx-auto grid max-w-3xl gap-6 px-4 py-10">
	<header class="grid gap-3">
		<LogoMark surface="page" />
		<div class="grid gap-1">
			<h1 class="title-1 text-ink">{document.title}</h1>
			<p class="text-body text-ink-muted">{document.summary}</p>
			<p class="text-small text-ink-subtle">Version du {formatDay(new Date(`${currentTermsVersion}T12:00:00`))}</p>
		</div>
	</header>

	<Alert tone="warning" title="Texte provisoire">Ce texte sera remplacé par sa version définitive, relue par un juriste.</Alert>

	{#each document.sections as section, sectionIndex (section.heading)}
		<section class="grid gap-2">
			<h2 class="title-2 text-ink">{sectionIndex + 1}. {section.heading}</h2>
			{#each section.paragraphs as paragraph, paragraphIndex (paragraphIndex)}
				<p class="text-body text-ink-muted">{paragraph}</p>
			{/each}
		</section>
	{/each}
</main>
