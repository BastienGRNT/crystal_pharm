<script lang="ts">
	import type { Snippet } from 'svelte';
	import LogoMark from '../../atoms/LogoMark.svelte';
	import ThemeToggle from '../../molecules/ThemeToggle.svelte';
	import type { AuthenticationSpace } from './authenticationForms';

	type AuthenticationScreenProps = {
		space: AuthenticationSpace;
		title: string;
		subtitle: string;
		footer?: Snippet;
		children: Snippet;
	};

	let { space, title, subtitle, footer, children }: AuthenticationScreenProps = $props();
</script>

<svelte:head>
	<title>{title} · Crystal Pharm</title>
</svelte:head>

<main class="grid min-h-screen bg-app font-sans text-ink lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
	<aside class="relative flex flex-col gap-10 overflow-hidden bg-rail px-10 py-10 max-lg:px-6 max-lg:py-5">
		<span class="absolute inset-x-0 top-0 h-module-bar bg-accent-on-rail" aria-hidden="true"></span>

		<div class="flex items-center gap-3">
			<LogoMark size={36} />
			<div>
				<p class="title-2 text-on-rail">Crystal Pharm</p>
				<p class="text-small text-accent-on-rail">{space.label}</p>
			</div>
		</div>

		<div class="mt-auto mb-auto grid max-w-md gap-3 max-lg:hidden">
			<p class="text-display text-on-rail">{space.headline}</p>
			<p class="text-body text-rail-ink">{space.description}</p>
		</div>
	</aside>

	<section class="relative grid place-items-center px-6 py-12">
		<div class="absolute top-4 right-4">
			<ThemeToggle />
		</div>

		<div class="grid w-full max-w-sm gap-6">
			<div class="grid gap-1">
				<h1 class="title-1 text-ink">{title}</h1>
				<p class="text-body text-ink-muted">{subtitle}</p>
			</div>
			{@render children()}
			{#if footer}
				<p class="text-small text-ink-muted">{@render footer()}</p>
			{/if}
		</div>
	</section>
</main>
