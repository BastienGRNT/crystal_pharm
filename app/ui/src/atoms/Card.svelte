<script lang="ts">
	import type { Snippet } from 'svelte';

	type CardProps = {
		spacing?: 'regular' | 'spacious';
		children: Snippet;
	};

	let { spacing = 'regular', children }: CardProps = $props();

	const spacingClasses = {
		regular: 'p-6',
		spacious: 'p-9'
	};
</script>

<div class="rounded-xl border border-line bg-surface shadow-card {spacingClasses[spacing]}">
	{@render children()}
</div>
