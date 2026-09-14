<script lang="ts">
	import SiteRenderer from "../engine/SiteRenderer.svelte";
	import type { SiteProps} from "../engine/contracts/site.type";

	import FalseSiteLayout from "../site/site1/FalseSiteLayout.svelte";
	import SiteLayout from "../site/site1/SiteLayout.svelte";

	const mockData: SiteProps = { titre: "Hello World !!!" };
</script>

<SiteRenderer Composant={SiteLayout} props={{ data: mockData }} />