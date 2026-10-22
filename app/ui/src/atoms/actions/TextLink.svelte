<script lang="ts">
	import type { Snippet } from 'svelte';

	type TextLinkProps = {
		href: string;
		children: Snippet;
	};

	let { href, children }: TextLinkProps = $props();
</script>

<a {href} class="rounded-xs font-medium text-accent-text underline decoration-1 underline-offset-3">
	{@render children()}
</a>
