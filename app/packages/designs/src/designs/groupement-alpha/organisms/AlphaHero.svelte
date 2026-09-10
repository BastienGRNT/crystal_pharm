<script lang="ts">
	import type { HeroContent } from '../../../sections/hero';
	import Wordmark from '../atoms/Wordmark.svelte';

	let { banner }: { banner: HeroContent } = $props();
</script>

<section>
	<div class="bande">
		<Wordmark label="ALPHA" />
		<h1>{banner.title}</h1>
		{#if banner.tagline}<p>{banner.tagline}</p>{/if}
		{#if banner.callToAction}
			<a href={banner.callToAction.url}>{banner.callToAction.label} →</a>
		{/if}
	</div>
</section>

<style>
	section {
		background: #18181b;
		color: #fafafa;
		padding: 5rem 1.5rem;
	}
	.bande {
		max-width: 46rem;
		margin: 0 auto;
	}
	h1 {
		margin: 1rem 0 0;
		font-size: clamp(2rem, 6vw, 3.5rem);
		font-weight: 800;
		line-height: 1.05;
	}
	p {
		margin: 1.25rem 0 0;
		max-width: 30rem;
		color: #d4d4d8;
	}
	a {
		display: inline-block;
		margin-top: 2rem;
		color: #fafafa;
		font-weight: 600;
		border-bottom: 2px solid #fafafa;
		padding-bottom: 0.2rem;
		text-decoration: none;
	}
</style>
