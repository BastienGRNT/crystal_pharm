<script lang="ts">
	import type { Snippet } from 'svelte';

	type StickyActionBarProps = {
		/** Le total, l'état de l'enregistrement, et le bouton qui valide. */
		children: Snippet;
	};

	let { children }: StickyActionBarProps = $props();
</script>

<!-- Sur mobile, la barre d'onglets est fixée en bas : la barre se pose au-dessus pour ne pas cacher le bouton. -->
<div
	class="sticky bottom-3 z-1 grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-float max-lg:bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+12px)] max-sm:p-3"
>
	{@render children()}
</div>
