<script lang="ts">
	type AvatarProps = {
		name: string;
		/** Une photo à la place des initiales. */
		imageUrl?: string;
		surface?: 'page' | 'rail';
		/** `large` : en tête d'une fiche, quand le visage compte plus que le nom. */
		size?: 'regular' | 'large';
	};

	let { name, imageUrl, surface = 'page', size = 'regular' }: AvatarProps = $props();

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
	const sizeClasses = {
		regular: 'size-avatar text-label',
		large: 'size-16 font-display text-[22px]'
	};
</script>

{#if imageUrl}
	<img src={imageUrl} alt="" title={name} class="flex-none rounded-full object-cover {sizeClasses[size]} {surfaceClasses[surface]}" />
{:else}
	<span
		class="inline-grid flex-none place-items-center rounded-full {sizeClasses[size]} {surfaceClasses[surface]}"
		title={name}
		aria-hidden="true"
	>
		{initials}
	</span>
{/if}
