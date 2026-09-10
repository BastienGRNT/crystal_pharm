<script lang="ts">
	import type { TeamContent } from '../../../sections/team';

	// Ce design n'affiche pas `member.note`, alors que `classique` l'affiche.
	// Mêmes données : c'est le design qui choisit, la note n'est jamais perdue.
	let { member }: { member: TeamContent['members'][number] } = $props();
</script>

<li>
	{#if member.photo}<img src={member.photo} alt="" />{/if}
	<strong>{member.name}</strong>
	<span>{member.role}</span>
</li>

<style>
	li {
		width: 7rem;
		text-align: center;
	}
	img {
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 50%;
		object-fit: cover;
	}
	strong {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.9rem;
	}
	span {
		font-size: 0.8rem;
		color: #64748b;
	}
</style>
