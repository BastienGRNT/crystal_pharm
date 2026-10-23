<script lang="ts">
	import type { Snippet } from 'svelte';

	type TextLinkProps = {
		href: string;
		/** Pour lire un document sans quitter la page en cours (un formulaire à moitié rempli). */
		opensInNewTab?: boolean;
		children: Snippet;
	};

	let { href, opensInNewTab = false, children }: TextLinkProps = $props();
</script>

<a {href} target={opensInNewTab ? '_blank' : undefined} rel={opensInNewTab ? 'noopener' : undefined} class="rounded-xs font-medium text-accent-text underline decoration-1 underline-offset-3">
	{@render children()}
</a>
