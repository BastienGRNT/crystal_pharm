<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import type { IconName } from './icons';
	import type { ButtonVariant } from './button';

	type ButtonProps = {
		children: Snippet;
		variant?: ButtonVariant;
		icon?: IconName;
		href?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		isFullWidth?: boolean;
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
		onclick
	}: ButtonProps = $props();

	const variantClasses: Record<ButtonVariant, string> = {
		primary: 'bg-accent text-on-accent hover:bg-accent-hover',
		ghost: 'bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink'
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
	<button {type} {disabled} {onclick} class={classes}>
		{#if icon}<Icon name={icon} size={16} />{/if}
		{@render children()}
	</button>
{/if}
