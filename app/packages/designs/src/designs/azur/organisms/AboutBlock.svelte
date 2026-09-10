<script lang="ts">
	import type { AboutContent } from '../../../sections/about';
	import SoftTitle from '../atoms/SoftTitle.svelte';

	let { text }: { text: AboutContent } = $props();
</script>

<section>
	<SoftTitle>{text.title}</SoftTitle>
	<p>{text.body}</p>
	{#if text.signature}<p class="signature">— {text.signature}</p>{/if}
</section>

<style>
	section {
		max-width: 42rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}
	p {
		line-height: 1.7;
		color: #334155;
	}
	.signature {
		text-align: right;
		font-style: italic;
		color: #64748b;
	}
</style>
