<script lang="ts">
	import Button from '../../atoms/actions/Button.svelte';
	import Card from '../../atoms/Card.svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
	import LogoMark from '../../atoms/LogoMark.svelte';
	import Alert from '../../molecules/Alert.svelte';
	import ThemeToggle from '../../molecules/ThemeToggle.svelte';
	import type { TestCheckoutLine } from './testCheckout';

	type TestCheckoutScreenProps = {
		description: string;
		amountLabel: string;
		lines: TestCheckoutLine[];
		cancelHref: string;
		/** Le champ envoyé avec le formulaire : `paid` ou `refused`. */
		outcomeFieldName: string;
		failureMessage?: string;
	};

	let { description, amountLabel, lines, cancelHref, outcomeFieldName, failureMessage }: TestCheckoutScreenProps = $props();
</script>

<svelte:head>
	<title>Paiement · Crystal Pharm</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-app font-sans text-ink">
	<header class="flex h-topbar items-center justify-between border-b border-line bg-surface px-6">
		<div class="flex items-center gap-2.5">
			<LogoMark size={26} />
			<p class="title-2">Crystal Pharm <span class="font-normal text-ink-muted">· Paiement</span></p>
		</div>
		<ThemeToggle />
	</header>

	<main class="flex flex-1 justify-center px-4 py-10">
		<div class="grid w-full max-w-[460px] content-start gap-4">
			<Alert tone="info" title="Paiement de test">Aucun argent ne circule : choisissez de payer ou de simuler un refus de la banque.</Alert>

			<Card spacing="spacious">
				<form method="POST" class="grid gap-5">
					<div class="grid gap-1">
						<p class="text-small text-ink-muted">{description}</p>
						<p class="text-display tabular-nums">{amountLabel}</p>
						<p class="text-small text-ink-muted">à payer aujourd’hui</p>
					</div>

					{#if lines.length > 0}
						<ul class="grid gap-1.5 border-y border-line py-3">
							{#each lines as line (line.label)}
								<li class="flex items-center justify-between gap-3 text-body">
									<span class="text-ink-muted">{line.label}</span>
									<span class="tabular-nums">{line.amountLabel}</span>
								</li>
							{/each}
						</ul>
					{/if}

					<div class="grid gap-1.5" aria-hidden="true">
						<p class="text-[13px] font-medium">Carte de test</p>
						<div class="flex items-center gap-2 rounded-sm border border-line-strong bg-surface-subtle px-2.5 py-2 text-body text-ink-muted tabular-nums">
							<Icon name="credit-card" size={18} />
							4242 4242 4242 4242
							<span class="ml-auto">12/34 · 123</span>
						</div>
					</div>

					{#if failureMessage}<Alert tone="danger">{failureMessage}</Alert>{/if}

					<div class="grid gap-2">
						<Button type="submit" name={outcomeFieldName} value="paid" icon="lock-simple" isFullWidth>
							Payer {amountLabel}
						</Button>
						<Button type="submit" name={outcomeFieldName} value="refused" variant="ghost" isFullWidth>
							Simuler un refus de la banque
						</Button>
					</div>
				</form>
			</Card>

			<a href={cancelHref} class="justify-self-center text-small text-ink-muted underline">Annuler et revenir</a>
		</div>
	</main>
</div>
