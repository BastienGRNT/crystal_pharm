<script lang="ts">
	import type { SectionProps } from '../../../layout';

	let { data }: SectionProps<'team'> = $props();
</script>

<section class="team">
	<h2>Notre équipe</h2>
	<ul>
		{#each data as member}
			<li>
				<img src={member.photoUrl} alt={member.name} width="56" height="56" />
				<strong>{member.name}</strong>
				<span>{member.role}</span>
			</li>
		{/each}
	</ul>
</section>

<style>
	section {
		padding: 1.25rem 1.5rem;
		border-radius: 10px;
		background: #f0fdf4;
		margin-block: 0.75rem;
		font-family: system-ui, sans-serif;
		color: #1f2933;
	}
	h2 {
		margin: 0 0 0.75rem;
		color: #166534;
		font-size: 1.15rem;
		letter-spacing: 0.01em;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 1.25rem;
	}
	li {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 8rem;
		text-align: center;
	}
	img {
		border-radius: 50%;
		margin-bottom: 0.4rem;
	}
	span {
		color: #616e7c;
		font-size: 0.85rem;
	}
</style>
