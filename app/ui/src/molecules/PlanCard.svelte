<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';
	import CheckList from './CheckList.svelte';
	import type { CheckListItem } from './checkList';

	type PlanCardProps = {
		/** Le groupe de choix : une seule carte du même `name` peut être choisie. */
		name: string;
		value: string;
		selectedValue?: string;
		/** Déjà acquise ou indisponible : la carte est grisée et ne se choisit pas. */
		disabled?: boolean;
		/** La formule à mettre en avant (celle du milieu). */
		featuredLabel?: string;
		title: string;
		description: string;
		/** Le montant à payer, déjà formaté (« 29,99 € »). */
		amountLabel: string;
		periodLabel: string;
		/** Le prix d'avant remise, barré à côté. */
		previousAmountLabel?: string;
		/** Sous le prix : l'équivalent par mois, l'économie. */
		priceNote?: string;
		features: CheckListItem[];
		/** En haut à droite : un statut (« Offert par … »). */
		status?: Snippet;
		/** En bas : un badge de réduction, une précision. */
		footer?: Snippet;
	};

	let {
		name,
		value,
		selectedValue = $bindable(''),
		disabled = false,
		featuredLabel,
		title,
		description,
		amountLabel,
		periodLabel,
		previousAmountLabel,
		priceNote,
		features,
		status,
		footer
	}: PlanCardProps = $props();
</script>

<!-- Une étiquette de prix : la formule mise en avant porte son bandeau, le prix se lit en grand. -->
<label
	class="group relative flex flex-col overflow-hidden rounded-xl border bg-surface shadow-card transition-[border-color,box-shadow,transform] duration-[120ms] select-none has-[:checked]:border-accent has-[:checked]:ring-2 has-[:checked]:ring-accent-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent {disabled
		? 'cursor-default border-line bg-surface-subtle opacity-70'
		: 'cursor-pointer hover:-translate-y-px hover:border-line-strong hover:shadow-float'} {featuredLabel && !disabled ? 'border-accent max-lg:order-first' : 'border-line'}"
>
	<input type="radio" {name} {value} {disabled} bind:group={selectedValue} class="sr-only" />
	{#if featuredLabel && !disabled}
		<span class="flex items-center justify-center gap-1.5 bg-accent px-4 py-1.5 text-eyebrow text-on-accent">
			<Icon name="sparkle" size={14} />{featuredLabel}
		</span>
	{/if}
	<span class="grid gap-4 p-5 pb-4">
		<span class="flex items-start justify-between gap-3">
			<span class="grid gap-1">
				<span class="font-display text-[22px] leading-7 text-ink">{title}</span>
				<span class="text-small text-ink-muted">{description}</span>
			</span>
			<span
				aria-hidden="true"
				class="grid size-7 flex-none place-items-center rounded-full border-2 border-line-strong text-transparent group-has-[:checked]:border-accent group-has-[:checked]:bg-accent group-has-[:checked]:text-on-accent"
			>
				<Icon name="check" size={15} />
			</span>
		</span>
		{@render status?.()}
		<span class="grid gap-0.5">
			<span class="flex flex-wrap items-baseline gap-x-2 tabular-nums">
				<span class="font-display text-[44px] leading-[48px] text-ink">{amountLabel}</span>
				<span class="text-small text-ink-muted">{periodLabel}</span>
				{#if previousAmountLabel}
					<s class="text-small text-ink-subtle"><span class="sr-only">au lieu de </span>{previousAmountLabel}</s>
				{/if}
			</span>
			{#if priceNote}<span class="text-small text-ink-muted">{priceNote}</span>{/if}
		</span>
	</span>
	<span class="relative grid flex-1 content-start justify-items-start gap-3 border-t border-dashed border-line-strong/50 bg-surface-subtle p-5 pt-4">
		<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full border border-line bg-app"></span>
		<span aria-hidden="true" class="absolute -top-2 -right-2 size-4 rounded-full border border-line bg-app"></span>
		<CheckList items={features} />
		{@render footer?.()}
	</span>
</label>
