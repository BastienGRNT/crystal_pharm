<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { catalogueOrdonneMeta } from '../CatalogueOrdonneLayout.svelte';

	type Item = ModuleProps<typeof catalogueOrdonneMeta, 'team'>;
	let { team }: { team: Item[] } = $props();
</script>

<section>
	<h2>Notre équipe</h2>
	<ul>
		{#each team as member}
			<li>
				<img src={member.photoUrl} alt={member.name} width="48" height="48" />
				<span>{member.name} — {member.role}</span>
			</li>
		{/each}
	</ul>
</section>
