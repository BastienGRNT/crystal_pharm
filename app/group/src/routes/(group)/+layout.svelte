<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { signOutAndOpen } from '@crystal-pharm/auth/client';
	import { AppShell } from '@crystal-pharm/ui';
	import { groupNavigationSections } from '$lib/groupNavigationSections';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<AppShell
	navigationSections={groupNavigationSections}
	currentPathname={page.url.pathname}
	signedInUser={data.signedInGroupMember}
	spaceLabel="Espace groupement"
	onSignOut={() => signOutAndOpen('/login')}
>
	{@render children()}
</AppShell>
