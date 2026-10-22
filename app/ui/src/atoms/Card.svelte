<script lang="ts">
	import type { Snippet } from 'svelte';

	type CardProps = {
		spacing?: 'regular' | 'spacious';
		children: Snippet;
	};

	let { spacing = 'regular', children }: CardProps = $props();

	const spacingClasses = {
		regular: 'rounded-lg p-6',
		spacious: 'rounded-xl p-8'
	};
</script>

<div class={['border border-line bg-surface shadow-xs', spacingClasses[spacing]]}>
	{@render children()}
</div>
