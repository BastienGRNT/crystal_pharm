<script lang="ts">
	import type { SectionProps } from '../../layout';

	let { data }: SectionProps<'hero'> = $props();
</script>

<section>
	<h1>{data.title}</h1>
	<p>{data.subtitle}</p>
	<img src={data.imageUrl} alt="" width="240" height="120" />
</section>
