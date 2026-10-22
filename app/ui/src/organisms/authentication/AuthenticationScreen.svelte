<script lang="ts">
	import type { Snippet } from 'svelte';
	import Card from '../../atoms/Card.svelte';
	import LogoMark from '../../atoms/LogoMark.svelte';
	import ThemeToggle from '../../molecules/ThemeToggle.svelte';

	type AuthenticationScreenProps = {
		title: string;
		subtitle: string;
		footer?: Snippet;
		children: Snippet;
	};

	let { title, subtitle, footer, children }: AuthenticationScreenProps = $props();
</script>

<svelte:head>
	<title>{title} · Crystal Pharm</title>
</svelte:head>

<main class="relative grid min-h-screen place-items-center bg-app p-8 font-sans text-ink">
	<div class="absolute top-4 right-4">
		<ThemeToggle />
	</div>
	<div class="w-full max-w-sm">
		<Card spacing="spacious">
			<div class="grid gap-6">
				<LogoMark size={40} surface="page" />
				<div class="grid gap-1">
					<h1 class="title-1 text-ink">{title}</h1>
					<p class="text-body text-ink-muted">{subtitle}</p>
				</div>
				{@render children()}
				{#if footer}
					<p class="text-small text-ink-muted">{@render footer()}</p>
				{/if}
			</div>
		</Card>
	</div>
</main>
