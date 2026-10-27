<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../atoms/icons/Icon.svelte';
	import Tag from '../atoms/Tag.svelte';
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

<label
	class="relative flex flex-col gap-4 rounded-lg border bg-surface p-5 shadow-card transition-colors duration-[120ms] select-none has-[:checked]:border-accent has-[:checked]:ring-2 has-[:checked]:ring-accent-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent {disabled
		? 'cursor-default border-line bg-surface-subtle opacity-70'
		: 'cursor-pointer hover:border-line-strong'} {featuredLabel && !disabled ? 'border-accent lg:-my-3 lg:py-8' : 'border-line'}"
>
	<input type="radio" {name} {value} {disabled} bind:group={selectedValue} class="peer sr-only" />
	{#if featuredLabel && !disabled}
		<span class="absolute -top-3 left-1/2 -translate-x-1/2"><Tag tone="accent">{featuredLabel}</Tag></span>
	{/if}
	<span class="flex items-start justify-between gap-3">
		<span class="grid gap-1">
			<span class="title-2 text-ink">{title}</span>
			<span class="text-small text-ink-muted">{description}</span>
		</span>
		<span
			aria-hidden="true"
			class="grid size-6 flex-none place-items-center rounded-full border border-line-strong text-transparent peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent"
		>
			<Icon name="check" size={14} />
		</span>
	</span>
	{@render status?.()}
	<span class="grid gap-0.5">
		<span class="flex flex-wrap items-baseline gap-x-2 tabular-nums">
			<span class="title-1 text-ink">{amountLabel}</span>
			<span class="text-small text-ink-muted">{periodLabel}</span>
			{#if previousAmountLabel}
				<s class="text-small text-ink-subtle"><span class="sr-only">au lieu de </span>{previousAmountLabel}</s>
			{/if}
		</span>
		{#if priceNote}<span class="text-small text-ink-muted">{priceNote}</span>{/if}
	</span>
	<span class="border-t border-line-soft pt-3"><CheckList items={features} /></span>
	{@render footer?.()}
</label>
