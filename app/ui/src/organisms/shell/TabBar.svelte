<script lang="ts">
	import Icon from '../../atoms/icons/Icon.svelte';
	import { dismissOnOutsidePointerDown } from '../../molecules/fields/pickers/dismissOnOutsidePointerDown';
	import type { NavigationLink } from './navigation';
	import NavigationCount from './NavigationCount.svelte';

	type TabBarProps = {
		navigationLinks: readonly NavigationLink[];
		currentNavigationHref: string | undefined;
		hrefsNeedingAttention: readonly string[];
		countsByHref: Readonly<Record<string, number>>;
	};

	let { navigationLinks, currentNavigationHref, hrefsNeedingAttention, countsByHref }: TabBarProps = $props();

	// Au-delà de cinq onglets, les libellés ne tiennent plus sur un téléphone : les derniers passent dans « Plus ».
	const maximumTabCount = 5;
	const visibleLinks = $derived(
		navigationLinks.length > maximumTabCount ? navigationLinks.slice(0, maximumTabCount - 1) : navigationLinks
	);
	const overflowLinks = $derived(navigationLinks.slice(visibleLinks.length));
	const isCurrentInOverflow = $derived(overflowLinks.some((link) => link.href === currentNavigationHref));
	const overflowMenuId = $props.id();
	let isOverflowOpen = $state(false);

	const tabClasses =
		"relative grid h-full w-full content-center justify-items-center gap-1 px-0.5 text-[11.5px] leading-[14px] font-medium text-ink-subtle no-underline aria-[current=page]:font-semibold aria-[current=page]:text-accent-text aria-[current=page]:before:absolute aria-[current=page]:before:inset-x-[22%] aria-[current=page]:before:top-0 aria-[current=page]:before:h-[3px] aria-[current=page]:before:rounded-b-[3px] aria-[current=page]:before:bg-accent aria-[current=page]:before:content-['']";
</script>

<!-- Sur un téléphone, le menu passe sous le pouce : une colonne fixe mangerait le quart de l'écran. -->
<nav
	aria-label="Navigation principale"
	class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
>
	<ul class="flex h-tabbar">
		{#each visibleLinks as navigationLink (navigationLink.href)}
			<li class="min-w-0 flex-1">
				<a
					href={navigationLink.href}
					aria-current={navigationLink.href === currentNavigationHref ? 'page' : undefined}
					class={tabClasses}
				>
					{#if navigationLink.icon}
						<Icon name={navigationLink.icon} size={22} />
					{/if}
					<span class="max-w-full truncate">{navigationLink.label}</span>
					<NavigationCount
						count={countsByHref[navigationLink.href]}
						needsAttention={hrefsNeedingAttention.includes(navigationLink.href)}
						placement="corner"
					/>
				</a>
			</li>
		{/each}
		{#if overflowLinks.length > 0}
			<li class="relative min-w-0 flex-1" use:dismissOnOutsidePointerDown={() => (isOverflowOpen = false)}>
				<button
					type="button"
					aria-expanded={isOverflowOpen}
					aria-controls={overflowMenuId}
					aria-current={isCurrentInOverflow ? 'page' : undefined}
					onclick={() => (isOverflowOpen = !isOverflowOpen)}
					class="{tabClasses} cursor-pointer"
				>
					<Icon name="caret-down" size={22} class="rotate-180" />
					Plus
				</button>
				{#if isOverflowOpen}
					<ul
						id={overflowMenuId}
						class="absolute right-2 bottom-full mb-2 grid w-60 gap-0.5 rounded-md border border-line bg-surface p-1.5 shadow-float"
					>
						{#each overflowLinks as overflowLink (overflowLink.href)}
							<li>
								<a
									href={overflowLink.href}
									aria-current={overflowLink.href === currentNavigationHref ? 'page' : undefined}
									onclick={() => (isOverflowOpen = false)}
									class="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[15px] text-ink no-underline hover:bg-surface-muted aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent-text"
								>
									{#if overflowLink.icon}<Icon name={overflowLink.icon} size={20} />{/if}
									<span class="flex-1">{overflowLink.label}</span>
									<NavigationCount
										count={countsByHref[overflowLink.href]}
										needsAttention={hrefsNeedingAttention.includes(overflowLink.href)}
									/>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</li>
		{/if}
	</ul>
</nav>
