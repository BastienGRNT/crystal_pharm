<script lang="ts">
	import type { SiteProps } from "../../engine/contracts/site.type";

	let { data }: { data: SiteProps } = $props();
</script>

<h1>{data.titre}</h1>