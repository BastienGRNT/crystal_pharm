<script lang="ts">
	import type { PickedFields } from '../../../layout-module-contracts';
	import type { HeroModule } from '../../../modules/unique/hero';
	import { uniqueFixeMeta } from '../layout.meta';

	type Hero = PickedFields<HeroModule, typeof uniqueFixeMeta.supports.hero>;
	let { hero }: { hero: Hero } = $props();
</script>

<section>
	<h1>{hero.title}</h1>
	<p>{hero.subtitle}</p>
	<img src={hero.imageUrl} alt={hero.title} />
</section>
