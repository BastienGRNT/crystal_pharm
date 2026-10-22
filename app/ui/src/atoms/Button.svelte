<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonProps = {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit';
		isFullWidth?: boolean;
		disabled?: boolean;
		onclick?: () => void;
		children: Snippet;
	};

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		isFullWidth = false,
		disabled = false,
		onclick,
		children
	}: ButtonProps = $props();

	const variantClasses = {
		primary: 'bg-accent text-on-accent shadow-control-primary hover:bg-accent-hover',
		secondary: 'bg-surface text-ink shadow-xs ring-1 ring-line ring-inset hover:bg-surface-muted',
		danger: 'bg-surface text-danger shadow-xs ring-1 ring-line ring-inset hover:bg-danger-soft',
		ghost: 'bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink'
	};

	const sizeClasses = {
		sm: 'h-control-sm px-2.5 text-label',
		md: 'h-control-md px-3.5 text-control',
		lg: 'h-control-lg px-4.5 text-body'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class={[
		'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md leading-none font-medium whitespace-nowrap transition-colors duration-120',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
		'disabled:cursor-not-allowed disabled:opacity-50',
		variantClasses[variant],
		sizeClasses[size],
		isFullWidth && 'w-full'
	]}
>
	{@render children()}
</button>
