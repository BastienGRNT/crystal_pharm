<script lang="ts">
	import type { PickedFields } from '../../../layout-module-contracts';
	import type { PharmacyInfoModule } from '../../../modules/main/pharmacy-info';
	import { uniqueFixeMeta } from '../layout.meta';

	type Info = PickedFields<PharmacyInfoModule, typeof uniqueFixeMeta.supports.pharmacyInfo>;
	let { info }: { info: Info } = $props();
</script>

<section>
	<h2>{info.name}</h2>
	<p>{info.address}</p>
	<p>{info.phone}</p>
</section>
