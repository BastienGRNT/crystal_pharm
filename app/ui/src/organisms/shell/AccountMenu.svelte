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
		/** Les pages du compte, reprises dans ce menu : sur un petit écran, le bandeau n'a plus la place de les montrer. */
		accountLinks?: readonly NavigationLink[];
	};

	let { signedInUser, onSignOut, accountLinks = [] }: AccountMenuProps = $props();

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
		'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-[15px] leading-5 text-ink hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none';
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
		class="flex cursor-pointer items-center gap-1.5 rounded-full p-1 pr-2 text-rail-ink hover:bg-rail-raised hover:text-on-rail aria-expanded:bg-rail-raised"
	>
		<Avatar name={signedInUser.name} surface="rail" />
		<Icon name="caret-down" size={15} class="flex-none" />
	</button>

	{#if isOpen}
		<div
			id={menuId}
			role="group"
			aria-label="Mon compte"
			class="absolute top-full right-0 z-40 mt-2 w-72 rounded-lg border border-line bg-surface p-2 font-sans text-ink shadow-float"
		>
			<div class="border-b border-dashed border-line px-3 pt-2 pb-3">
				<p class="truncate font-display text-[17px] leading-6">{signedInUser.name}</p>
				<p class="truncate text-small text-ink-muted">{signedInUser.detail}</p>
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
