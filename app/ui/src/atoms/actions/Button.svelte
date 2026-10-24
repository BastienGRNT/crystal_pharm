<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../icons/Icon.svelte';
	import type { IconName } from '../icons/icons';
	import { buttonClasses, type ButtonVariant } from './button';

	type ButtonProps = {
		children: Snippet;
		variant?: ButtonVariant;
		icon?: IconName;
		href?: string;
		/** Avec `href` : ouvre la page à côté, sans quitter celle en cours (un formulaire à moitié rempli). */
		opensInNewTab?: boolean;
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
		opensInNewTab = false,
		type = 'button',
		disabled = false,
		isFullWidth = false,
		formaction,
		name,
		value,
		onclick
	}: ButtonProps = $props();

	const classes = $derived(buttonClasses(variant, isFullWidth));
</script>

{#if href}
	<a {href} target={opensInNewTab ? '_blank' : undefined} rel={opensInNewTab ? 'noopener' : undefined} class={classes}>
		{#if icon}<Icon name={icon} size={16} />{/if}
		{@render children()}
	</a>
{:else}
	<button {type} {disabled} {formaction} {name} {value} {onclick} class={classes}>
		{#if icon}<Icon name={icon} size={16} />{/if}
		{@render children()}
	</button>
{/if}
