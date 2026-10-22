<script lang="ts">
	type AvatarProps = {
		name: string;
	};

	let { name }: AvatarProps = $props();

	const initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((namePart) => namePart[0]?.toUpperCase())
			.join('')
	);
</script>

<span
	class="inline-grid size-8 flex-none place-items-center rounded-full bg-surface-muted text-caption font-semibold text-ink-muted"
	aria-hidden="true"
>
	{initials}
</span>
