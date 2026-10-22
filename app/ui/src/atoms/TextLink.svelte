<script lang="ts">
	import type { Snippet } from 'svelte';

	type TextLinkProps = {
		href: string;
		children: Snippet;
	};

	let { href, children }: TextLinkProps = $props();
</script>

<a
	{href}
	class="rounded-sm font-medium text-accent-text underline decoration-1 underline-offset-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
>
	{@render children()}
</a>
