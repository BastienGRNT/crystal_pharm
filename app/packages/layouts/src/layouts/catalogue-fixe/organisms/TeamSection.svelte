<script lang="ts">
	import type { PickedFields } from '../../../layout-module-contracts';
	import type { TeamModule } from '../../../modules/catalogue/team';
	import { catalogueFixeMeta } from '../layout.meta';

	type Member = PickedFields<TeamModule, typeof catalogueFixeMeta.supports.team>;
	let { team }: { team: Member[] } = $props();
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
