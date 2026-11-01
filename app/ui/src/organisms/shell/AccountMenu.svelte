<script lang="ts">
	import { onMount } from 'svelte';
	import Avatar from '../../atoms/Avatar.svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
	import { dismissOnOutsidePointerDown } from '../../molecules/fields/pickers/dismissOnOutsidePointerDown';
	import { applyAndRememberTheme, readCurrentTheme, type Theme } from '../../molecules/themePreference';
	import type { NavigationLink, SignedInUserSummary } from './navigation';

	type AccountMenuProps = {
		signedInUser: SignedInUserSummary;
		onSignOut: () => void;
		/** `above` : en bas de la colonne, le nom à côté de l'avatar ; `below` : l'avatar seul, en haut de l'écran du mobile. */
		placement?: 'above' | 'below';
		/** Sur mobile, les pages du compte n'ont pas d'onglet : elles passent dans ce menu. */
		accountLinks?: readonly NavigationLink[];
	};

	let { signedInUser, onSignOut, placement = 'below', accountLinks = [] }: AccountMenuProps = $props();

	const menuId = $props.id();
	let isOpen = $state(false);
	let currentTheme = $state<Theme>('light');
	let triggerElement: HTMLButtonElement | undefined = $state();

	onMount(() => {
		currentTheme = readCurrentTheme();
	});

	function closeMenuOnEscape(event: KeyboardEvent): void {
		if (!isOpen || event.key !== 'Escape') return;
		event.preventDefault();
		isOpen = false;
		triggerElement?.focus();
	}

	function switchTheme(): void {
		currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
		applyAndRememberTheme(currentTheme);
	}

	const menuItemClasses =
		'flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-left text-[14px] leading-5 text-ink hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none';
</script>

<svelte:window onkeydown={closeMenuOnEscape} />

<div class="relative" use:dismissOnOutsidePointerDown={() => (isOpen = false)}>
	<button
		bind:this={triggerElement}
		type="button"
		aria-label="Mon compte, {signedInUser.name}"
		aria-expanded={isOpen}
		aria-controls={menuId}
		onclick={() => (isOpen = !isOpen)}
		class={placement === 'above'
			? 'flex w-full cursor-pointer items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-surface-muted aria-expanded:bg-surface-muted'
			: 'grid cursor-pointer place-items-center rounded-full p-0.5 hover:bg-surface-muted aria-expanded:bg-surface-muted'}
	>
		<Avatar name={signedInUser.name} />
		{#if placement === 'above'}
			<span class="grid min-w-0 flex-1">
				<span class="truncate text-[14px] leading-5 font-semibold text-ink">{signedInUser.name}</span>
				<span class="truncate text-[12.5px] leading-4 text-ink-subtle">{signedInUser.detail}</span>
			</span>
			<Icon name="caret-down" size={16} class="flex-none rotate-180 text-ink-subtle" />
		{/if}
	</button>

	{#if isOpen}
		<div
			id={menuId}
			role="group"
			aria-label="Mon compte"
			class="absolute z-40 w-64 rounded-md border border-line bg-surface p-1.5 font-sans text-ink shadow-float {placement === 'above'
				? 'bottom-full left-0 mb-2'
				: 'top-full right-0 mt-2'}"
		>
			<div class="border-b border-line px-2.5 pt-1.5 pb-2.5">
				<p class="truncate text-[14px] leading-5 font-semibold">{signedInUser.name}</p>
				<p class="truncate text-[13px] leading-5 text-ink-muted">{signedInUser.detail}</p>
			</div>

			<div class="pt-1.5">
				{#each accountLinks as accountLink (accountLink.href)}
					<a href={accountLink.href} class="{menuItemClasses} no-underline" onclick={() => (isOpen = false)}>
						{#if accountLink.icon}<Icon name={accountLink.icon} class="text-ink-subtle" />{/if}
						{accountLink.label}
					</a>
				{/each}
				<button type="button" onclick={switchTheme} class={menuItemClasses}>
					{#if currentTheme === 'dark'}
						<Icon name="sun" class="text-ink-subtle" />
						Passer au thème clair
					{:else}
						<Icon name="moon" class="text-ink-subtle" />
						Passer au thème sombre
					{/if}
				</button>
				<button type="button" onclick={onSignOut} class={menuItemClasses}>
					<Icon name="sign-out" class="text-ink-subtle" />
					Se déconnecter
				</button>
			</div>
		</div>
	{/if}
</div>
