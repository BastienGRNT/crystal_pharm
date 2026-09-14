<script lang="ts">
	import SiteRenderer from "../engine/SiteRenderer.svelte";
	import type { SiteProps} from "../engine/contracts/site.type";
	import {renderSite} from "../engine/render-site";

	import FalseSiteLayout from "../site/site1/FalseSiteLayout.svelte";
	import SiteLayout from "../site/site1/SiteLayout.svelte";

	const mockData: SiteProps = { titre: "Hello World !!!" };

	const result = renderSite(SiteLayout, mockData);
</script>

<SiteRenderer {...result} />