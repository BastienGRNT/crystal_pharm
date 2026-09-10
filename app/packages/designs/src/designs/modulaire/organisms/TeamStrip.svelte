<script lang="ts">
	import type { TeamContent } from '../../../sections/team';
	import Card from '../atoms/Card.svelte';
	import CardTitle from '../atoms/CardTitle.svelte';
	import MemberChip from '../molecules/MemberChip.svelte';

	let { staff }: { staff: TeamContent } = $props();
</script>

<Card>
	<CardTitle>{staff.title}</CardTitle>
	<ul>
		{#each staff.members as member (member.name)}
			<MemberChip {member} />
		{/each}
	</ul>
</Card>

<style>
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}
</style>
