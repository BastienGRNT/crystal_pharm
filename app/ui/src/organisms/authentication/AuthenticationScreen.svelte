<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
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

	// Chaque étiquette penche un peu autrement, comme posées à la main sur le comptoir.
	const highlightTilts = ['-rotate-3 translate-x-2', 'rotate-2 -translate-x-1', '-rotate-1 translate-x-6'];
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
				<p class="font-display text-[22px] leading-7 text-on-rail">Crystal Pharm</p>
				<p class="text-eyebrow text-accent-on-rail">{space.label}</p>
			</div>
		</div>

		<div class="my-auto grid max-w-md gap-10 max-lg:hidden">
			<div class="grid gap-3">
				<p class="font-display text-[44px] leading-[52px] text-on-rail">{space.headline}</p>
				<p class="text-body text-rail-ink">{space.description}</p>
			</div>

			{#if space.highlights && space.highlights.length > 0}
				<ul class="grid gap-4" aria-label="En bref">
					{#each space.highlights as highlight, highlightIndex (highlight.title)}
						<li
							class="relative grid max-w-sm grid-cols-[auto_1fr] items-center gap-3 rounded-lg bg-surface px-4 py-3 shadow-float {highlightTilts[
								highlightIndex % highlightTilts.length
							]}"
						>
							<span aria-hidden="true" class="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-rail"></span>
							<span class="grid size-10 place-items-center rounded-md bg-accent-soft text-accent-text">
								<Icon name={highlight.icon} size={20} />
							</span>
							<span class="grid gap-0.5 border-l border-dashed border-line-strong/50 pl-3">
								<span class="text-body font-bold text-ink">{highlight.title}</span>
								<span class="text-small text-ink-muted">{highlight.detail}</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</aside>

	<section class="relative grid place-items-center px-6 py-12">
		<div class="absolute top-4 right-4">
			<ThemeToggle />
		</div>

		<div class="grid w-full max-w-md gap-6">
			<div class="grid gap-1">
				<h1 class="font-display text-[36px] leading-[44px] text-ink">{title}</h1>
				<p class="text-body text-ink-muted">{subtitle}</p>
			</div>
			<div class="rounded-xl border border-line bg-surface p-6 shadow-card max-sm:p-4">
				{@render children()}
			</div>
			{#if footer}
				<p class="relative border-t border-dashed border-line-strong/50 pt-4 text-small text-ink-muted">{@render footer()}</p>
			{/if}
		</div>
	</section>
</main>
