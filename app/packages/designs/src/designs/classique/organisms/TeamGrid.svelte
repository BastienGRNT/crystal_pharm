<script lang="ts">
	import type { TeamContent } from '../../../sections/team';
	import Band from '../atoms/Band.svelte';
	import Heading from '../atoms/Heading.svelte';
	import MemberCard from '../molecules/MemberCard.svelte';

	let { staff }: { staff: TeamContent } = $props();
</script>

<section>
	<Band>
		<Heading>{staff.title}</Heading>
		<div class="grille">
			{#each staff.members as member (member.name)}
				<MemberCard {member} />
			{/each}
		</div>
	</Band>
</section>

<style>
	section {
		background: #f4f7f5;
		padding: 2.5rem 1.5rem;
	}
	.grille {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 1rem;
	}
</style>
