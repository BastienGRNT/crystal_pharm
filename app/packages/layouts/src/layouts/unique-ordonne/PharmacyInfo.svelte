<script lang="ts">
	import type { SectionProps } from '../../layout';

	let { data }: SectionProps<'pharmacyInfo'> = $props();
</script>

<section>
	<h2>{data.name}</h2>
	<p>{data.address}</p>
	<p>{data.phone}</p>
</section>
