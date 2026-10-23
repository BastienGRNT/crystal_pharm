<script lang="ts">
	import type { Snippet } from 'svelte';
	import Card from '../atoms/Card.svelte';
	import LogoMark from '../atoms/LogoMark.svelte';
	import StepIndicator from '../molecules/navigation/StepIndicator.svelte';
	import ThemeToggle from '../molecules/ThemeToggle.svelte';

	type SetupScreenProps = {
		spaceLabel: string;
		steps: readonly string[];
		currentStepIndex: number;
		title: string;
		subtitle: string;
		/** Les actions de la barre du haut, à droite du choix du thème (se déconnecter…). */
		headerActions?: Snippet;
		children: Snippet;
	};

	let { spaceLabel, steps, currentStepIndex, title, subtitle, headerActions, children }: SetupScreenProps =
		$props();
</script>

<svelte:head>
	<title>{title} · Crystal Pharm</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-app font-sans text-ink">
	<header class="relative flex h-topbar flex-none items-center justify-between gap-4 bg-rail px-6 max-sm:px-4">
		<span class="absolute inset-x-0 top-0 h-module-bar bg-accent-on-rail" aria-hidden="true"></span>
		<div class="flex min-w-0 items-center gap-2.5">
			<LogoMark size={28} />
			<p class="truncate title-2 text-on-rail">
				Crystal Pharm <span class="font-normal text-accent-on-rail">· {spaceLabel}</span>
			</p>
		</div>
		<div class="flex flex-none items-center gap-1">
			<ThemeToggle surface="rail" />
			{@render headerActions?.()}
		</div>
	</header>

	<main class="flex flex-1 justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
		<div class="grid w-full max-w-[720px] content-start gap-6">
			<StepIndicator label="Étapes" {steps} {currentStepIndex} />
			<div class="grid gap-1">
				<h1 class="title-1 text-ink">{title}</h1>
				<p class="text-body text-ink-muted">{subtitle}</p>
			</div>
			<Card spacing="spacious">
				{@render children()}
			</Card>
		</div>
	</main>
</div>
