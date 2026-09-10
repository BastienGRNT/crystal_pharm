<script lang="ts">
	import type { HeroContent } from '../../../sections/hero';

	let { banner }: { banner: HeroContent } = $props();
</script>

<section style={banner.image ? `background-image:url(${banner.image})` : undefined}>
	<div class="voile">
		<h1>{banner.title}</h1>
		{#if banner.tagline}<p>{banner.tagline}</p>{/if}
		{#if banner.callToAction}
			<a href={banner.callToAction.url}>{banner.callToAction.label}</a>
		{/if}
	</div>
</section>

<style>
	section {
		background: #0c4a6e center/cover no-repeat;
		color: #fff;
	}
	.voile {
		background: linear-gradient(to top, #0c4a6ee6, #0c4a6e66);
		padding: 6rem 1.5rem 5rem;
		text-align: center;
	}
	h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3.25rem);
		font-weight: 300;
		letter-spacing: -0.02em;
	}
	p {
		margin: 1rem auto 0;
		max-width: 34rem;
		opacity: 0.9;
	}
	a {
		display: inline-block;
		margin-top: 2rem;
		padding: 0.7rem 1.6rem;
		border: 1px solid #fff;
		border-radius: 999px;
		color: #fff;
		text-decoration: none;
	}
</style>
