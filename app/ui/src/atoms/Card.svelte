<script lang="ts">
	import type { Snippet } from 'svelte';

	type CardProps = {
		spacing?: 'regular' | 'spacious';
		children: Snippet;
	};

	let { spacing = 'regular', children }: CardProps = $props();

	const spacingClasses = {
		regular: 'p-5',
		spacious: 'p-8'
	};
</script>

<div class="rounded-lg border border-line bg-surface shadow-card {spacingClasses[spacing]}">
	{@render children()}
</div>
