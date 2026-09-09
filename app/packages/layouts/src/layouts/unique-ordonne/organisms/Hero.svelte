<script lang="ts">
	import type { SectionProps } from '../../../layout';

	let { data }: SectionProps<'hero'> = $props();
</script>

<section class="hero">
	<div>
		<h1>{data.title}</h1>
		<p>{data.subtitle}</p>
	</div>
	<img src={data.imageUrl} alt="" width="240" height="120" />
</section>

<style>
	section {
		padding: 1.25rem 1.5rem;
		border-radius: 10px;
		background: #faf5ff;
		margin-block: 0.75rem;
		font-family: system-ui, sans-serif;
		color: #1f2933;
	}
	h1 {
		margin: 0 0 0.75rem;
		color: #6b21a8;
		font-size: 1.6rem;
		letter-spacing: 0.01em;
	}
	.hero {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		justify-content: space-between;
		background: linear-gradient(120deg, #faf5ff, #fff);
		border: 1px solid #6b21a822;
	}
	p {
		margin: 0;
		color: #52606d;
	}
	img {
		border-radius: 10px;
	}
</style>
