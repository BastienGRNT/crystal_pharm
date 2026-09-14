<script lang="ts">
	import type { RenderSiteResult } from "./contracts/site.type";

	let { Composant, props }: RenderSiteResult = $props();
</script>

<Composant {...props} />