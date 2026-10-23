<script lang="ts">
	import { onMount } from 'svelte';
	import Avatar from '../../atoms/Avatar.svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
	import { dismissOnOutsidePointerDown } from '../../molecules/fields/pickers/dismissOnOutsidePointerDown';
	import { applyAndRememberTheme, readCurrentTheme, type Theme } from '../../molecules/themePreference';
	import type { SignedInUserSummary } from './navigation';

	type AccountMenuProps = {
		signedInUser: SignedInUserSummary;
		onSignOut: () => void;
	};

	let { signedInUser, onSignOut }: AccountMenuProps = $props();

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

<div class="relative mt-1" use:dismissOnOutsidePointerDown={() => (isOpen = false)}>
	<button
		bind:this={triggerElement}
		type="button"
		aria-label="Mon compte, {signedInUser.name}"
		aria-expanded={isOpen}
		aria-controls={menuId}
		onclick={() => (isOpen = !isOpen)}
		class="grid cursor-pointer place-items-center rounded-full p-0.5 hover:bg-rail-raised aria-expanded:bg-rail-raised"
	>
		<Avatar name={signedInUser.name} surface="rail" />
	</button>

	{#if isOpen}
		<div
			id={menuId}
			role="group"
			aria-label="Mon compte"
			class="absolute bottom-0 left-full z-30 ml-2.5 w-64 rounded-md border border-line bg-surface p-1.5 font-sans text-ink shadow-float"
		>
			<div class="border-b border-line px-2.5 pt-1.5 pb-2.5">
				<p class="truncate text-[14px] leading-5 font-semibold">{signedInUser.name}</p>
				<p class="truncate text-[13px] leading-5 text-ink-muted">{signedInUser.detail}</p>
			</div>

			<div class="pt-1.5">
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
