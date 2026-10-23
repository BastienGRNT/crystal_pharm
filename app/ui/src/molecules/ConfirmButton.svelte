<script lang="ts">
	import Button from '../atoms/actions/Button.svelte';
	import type { ButtonVariant } from '../atoms/actions/button';
	import type { IconName } from '../atoms/icons/icons';

	type ConfirmButtonProps = {
		/** Placé dans un formulaire : la confirmation l'envoie, avec ce bouton comme déclencheur. */
		label: string;
		icon?: IconName;
		variant?: ButtonVariant;
		title: string;
		description: string;
		confirmLabel: string;
		isDestructive?: boolean;
		formaction?: string;
		name?: string;
		value?: string;
	};

	let {
		label,
		icon,
		variant = 'secondary',
		title,
		description,
		confirmLabel,
		isDestructive = false,
		formaction,
		name,
		value
	}: ConfirmButtonProps = $props();

	const componentId = $props.id();
	const titleId = `confirm-title-${componentId}`;
	let dialogElement: HTMLDialogElement | undefined = $state();
</script>

<Button {variant} {icon} onclick={() => dialogElement?.showModal()}>{label}</Button>

<dialog
	bind:this={dialogElement}
	aria-labelledby={titleId}
	class="m-auto w-[min(440px,calc(100vw-32px))] rounded-lg border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-ink/40"
>
	<div class="grid gap-4 p-5">
		<div class="grid gap-1.5">
			<h2 id={titleId} class="title-2">{title}</h2>
			<p class="text-body text-ink-muted">{description}</p>
		</div>
		<div class="flex flex-wrap justify-end gap-2">
			<Button variant="ghost" onclick={() => dialogElement?.close()}>Annuler</Button>
			<Button type="submit" variant={isDestructive ? 'danger' : 'primary'} {formaction} {name} {value}>{confirmLabel}</Button>
		</div>
	</div>
</dialog>
