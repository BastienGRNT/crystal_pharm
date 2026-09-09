<script lang="ts">
	import type { PickedFields } from '../../../layout-module-contracts';
	import type { AboutModule } from '../../../modules/unique/about';
	import { uniqueOrdonneMeta } from '../layout.meta';

	type About = PickedFields<AboutModule, typeof uniqueOrdonneMeta.supports.about>;
	let { about }: { about: About } = $props();
</script>

<section>
	<h2>{about.title}</h2>
	<p>{about.text}</p>
</section>
