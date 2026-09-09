<script lang="ts">
	import type { SectionProps } from '../../layout';

	let { data }: SectionProps<'about'> = $props();
</script>

<section>
	<h2>{data.title}</h2>
	<p>{data.text}</p>
</section>
