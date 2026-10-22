<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { signOutAndOpen } from '@crystal-pharm/auth/client';
	import { AppShell } from '@crystal-pharm/ui';
	import { adminNavigationLinks } from '$lib/adminNavigationLinks';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<AppShell
	navigationLinks={adminNavigationLinks}
	currentPathname={page.url.pathname}
	signedInUser={data.signedInPlatformAdmin}
	spaceLabel="Administration"
	onSignOut={() => signOutAndOpen('/login')}
>
	{@render children()}
</AppShell>
