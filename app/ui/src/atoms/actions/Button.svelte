<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/icons';
	import type { ButtonVariant } from './button';

	type ButtonProps = {
		children: Snippet;
		variant?: ButtonVariant;
		icon?: IconName;
		href?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		isFullWidth?: boolean;
		/** Envoyés avec le formulaire : l'action visée et la valeur du bouton cliqué. */
		formaction?: string;
		name?: string;
		value?: string;
		onclick?: () => void;
	};

	let {
		children,
		variant = 'primary',
		icon,
		href,
		type = 'button',
		disabled = false,
		isFullWidth = false,
		formaction,
		name,
		value,
		onclick
	}: ButtonProps = $props();

	const variantClasses: Record<ButtonVariant, string> = {
		primary: 'bg-accent text-on-accent hover:bg-accent-hover',
		secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-muted',
		ghost: 'bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink',
		danger: 'bg-danger text-surface hover:opacity-90'
	};

	const classes = $derived(
		`inline-flex h-control items-center justify-center gap-1.5 rounded-sm px-3.5 text-[14px] font-semibold leading-none whitespace-nowrap no-underline transition-colors duration-[120ms] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${isFullWidth ? 'w-full' : ''}`
	);
</script>

{#if href}
	<a {href} class={classes}>
		{#if icon}<Icon name={icon} size={16} />{/if}
		{@render children()}
	</a>
{:else}
	<button {type} {disabled} {formaction} {name} {value} {onclick} class={classes}>
		{#if icon}<Icon name={icon} size={16} />{/if}
		{@render children()}
	</button>
{/if}
