<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { signOutAndOpen } from '@crystal-pharm/auth/client';
	import { keepAccessibleLinks } from '@crystal-pharm/home';
	import { AppShell } from '@crystal-pharm/ui';
	import { accountLinks, toolLinks } from '$lib/toolLinks';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<AppShell
	navigationLinks={keepAccessibleLinks(toolLinks, data.accessibleToolKeys)}
	{accountLinks}
	currentPathname={page.url.pathname}
	signedInUser={data.signedInManager}
	spaceLabel={data.pharmacyName}
	hrefsNeedingAttention={data.hrefsNeedingAttention}
	onSignOut={() => signOutAndOpen('/login')}
>
	{@render children()}
</AppShell>
