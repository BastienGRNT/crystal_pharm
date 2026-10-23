<script lang="ts">
	type AvatarProps = {
		name: string;
		/** Une photo à la place des initiales. */
		imageUrl?: string;
		surface?: 'page' | 'rail';
	};

	let { name, imageUrl, surface = 'page' }: AvatarProps = $props();

	const initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((namePart) => namePart[0]?.toUpperCase())
			.join('')
	);

	const surfaceClasses = {
		page: 'bg-surface-muted text-ink-muted',
		rail: 'bg-rail-raised text-on-rail'
	};
</script>

{#if imageUrl}
	<img src={imageUrl} alt="" title={name} class="size-avatar flex-none rounded-full object-cover {surfaceClasses[surface]}" />
{:else}
	<span
		class="inline-grid size-avatar flex-none place-items-center rounded-full text-label {surfaceClasses[surface]}"
		title={name}
		aria-hidden="true"
	>
		{initials}
	</span>
{/if}
