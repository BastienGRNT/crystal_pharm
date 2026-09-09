<script lang="ts">
	import type { SectionProps } from '../../layout';

	let { data }: SectionProps<'team'> = $props();
</script>

<section>
	<h2>Notre équipe</h2>
	<ul>
		{#each data as member}
			<li>
				<img src={member.photoUrl} alt={member.name} width="48" height="48" />
				<span>{member.name} — {member.role}</span>
			</li>
		{/each}
	</ul>
</section>
