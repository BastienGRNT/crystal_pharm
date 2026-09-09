<script lang="ts">
	import type { SectionProps } from '../../../layout';

	let { data }: SectionProps<'pharmacyInfo'> = $props();
</script>

<section class="info">
	<h2>{data.name}</h2>
	<p class="line">{data.address}</p>
	<p class="line">{data.phone}</p>
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
	h2 {
		margin: 0 0 0.75rem;
		color: #6b21a8;
		font-size: 1.35rem;
		letter-spacing: 0.01em;
	}
	.line {
		margin: 0.15rem 0;
		color: #52606d;
		font-size: 0.95rem;
	}
</style>
