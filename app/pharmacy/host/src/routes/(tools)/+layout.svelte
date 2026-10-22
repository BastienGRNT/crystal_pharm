<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { signOutAndOpen } from '@crystal-pharm/auth/client';
	import { AppShell } from '@crystal-pharm/ui';
	import { toolLinks } from '$lib/toolLinks';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<AppShell
	navigationLinks={toolLinks}
	currentPathname={page.url.pathname}
	signedInUser={data.signedInManager}
	onSignOut={() => signOutAndOpen('/login')}
>
	{@render children()}
</AppShell>
