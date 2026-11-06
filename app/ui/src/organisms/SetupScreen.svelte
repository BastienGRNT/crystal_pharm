<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';
	import LogoMark from '../atoms/LogoMark.svelte';
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

<!-- Le parcours se lit à gauche, comme une pile d'étiquettes à remplir ; le formulaire de l'étape à droite. -->
<div class="grid min-h-screen bg-app font-sans text-ink lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
	<aside class="relative flex flex-col gap-8 bg-rail px-10 py-10 max-lg:gap-5 max-lg:px-6 max-lg:py-5 max-sm:px-4">
		<span class="absolute inset-x-0 top-0 h-module-bar bg-accent-on-rail" aria-hidden="true"></span>

		<div class="flex items-center justify-between gap-3">
			<div class="flex min-w-0 items-center gap-3">
				<LogoMark size={32} />
				<div class="min-w-0">
					<p class="truncate font-display text-[20px] leading-6 text-on-rail">Crystal Pharm</p>
					<p class="text-eyebrow text-accent-on-rail">{spaceLabel}</p>
				</div>
			</div>
			<div class="flex flex-none items-center gap-1">
				<ThemeToggle surface="rail" />
				{@render headerActions?.()}
			</div>
		</div>

		<ol aria-label="Étapes" class="my-auto grid gap-0 max-lg:flex max-lg:flex-wrap max-lg:gap-x-5 max-lg:gap-y-2">
			{#each steps as step, stepIndex (step)}
				{@const isDone = stepIndex < currentStepIndex}
				{@const isCurrent = stepIndex === currentStepIndex}
				<li aria-current={isCurrent ? 'step' : undefined} class="relative flex items-center gap-4 lg:pb-8 lg:last:pb-0">
					{#if stepIndex < steps.length - 1}
						<span
							aria-hidden="true"
							class="absolute top-12 bottom-0 left-6 border-l-2 border-dashed max-lg:hidden {isDone
								? 'border-accent-on-rail'
								: 'border-rail-raised'}"
						></span>
					{/if}
					<span
						class="grid size-12 flex-none place-items-center rounded-full font-display text-[22px] max-lg:size-8 max-lg:text-[16px] {isCurrent
							? 'bg-accent-on-rail text-rail'
							: isDone
								? 'border-2 border-accent-on-rail text-accent-on-rail'
								: 'border-2 border-rail-raised text-rail-ink'}"
					>
						{#if isDone}
							<Icon name="check" size={20} />
							<span class="sr-only">Terminé :</span>
						{:else}
							{stepIndex + 1}
						{/if}
					</span>
					<span class="grid gap-0.5">
						<span class="text-eyebrow text-rail-ink max-lg:hidden">Étape {stepIndex + 1}</span>
						<span class="text-body {isCurrent ? 'font-bold text-on-rail' : 'text-rail-ink'}">{step}</span>
					</span>
				</li>
			{/each}
		</ol>
	</aside>

	<main class="flex justify-center px-10 py-12 max-lg:px-6 max-lg:py-8 max-sm:px-4">
		<div class="grid w-full max-w-[720px] content-start gap-6">
			<div class="grid gap-1">
				<p class="text-eyebrow text-accent-text">Étape {currentStepIndex + 1} sur {steps.length}</p>
				<h1 class="font-display text-[36px] leading-[44px] text-ink">{title}</h1>
				<p class="text-body text-ink-muted">{subtitle}</p>
			</div>
			<div class="rounded-xl border border-line bg-surface p-7 shadow-card max-sm:p-4">
				{@render children()}
			</div>
		</div>
	</main>
</div>
