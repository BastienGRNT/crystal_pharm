<script lang="ts">
	import type { SectionProps } from '../../../layout';

	let { data }: SectionProps<'about'> = $props();
</script>

<section class="about">
	<h2>{data.title}</h2>
	<p>{data.text}</p>
</section>

<style>
	section {
		padding: 1.25rem 1.5rem;
		border-radius: 10px;
		background: #fff7ed;
		margin-block: 0.75rem;
		font-family: system-ui, sans-serif;
		color: #1f2933;
	}
	h2 {
		margin: 0 0 0.75rem;
		color: #9a3412;
		font-size: 1.15rem;
		letter-spacing: 0.01em;
	}
	p {
		margin: 0;
		line-height: 1.55;
		color: #3e4c59;
	}
</style>
