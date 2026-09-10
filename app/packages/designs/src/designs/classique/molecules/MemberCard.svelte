<script lang="ts">
	import type { TeamContent } from '../../../sections/team';

	// Le type est **dérivé** du contenu de la section, jamais retapé : c'est ce
	// qui garde `photo` en TrustedImageUrl plutôt qu'en string quelconque.
	let { member }: { member: TeamContent['members'][number] } = $props();
</script>

<article>
	{#if member.photo}<img src={member.photo} alt="" />{/if}
	<div>
		<strong>{member.name}</strong>
		<span class="role">{member.role}</span>
		<!-- Ce design affiche la note ; `modulaire` ne l'affiche pas. -->
		{#if member.note}<p>{member.note}</p>{/if}
	</div>
</article>

<style>
	article {
		display: flex;
		gap: 0.9rem;
		background: #fff;
		padding: 1rem;
		border-radius: 0.5rem;
	}
	img {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		object-fit: cover;
		flex: none;
	}
	.role {
		display: block;
		color: #0f5132;
		font-size: 0.85rem;
	}
	p {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: #555;
	}
</style>
