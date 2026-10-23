<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { signOutAndOpen } from '@crystal-pharm/auth/client';
	import { AppShell } from '@crystal-pharm/ui';
	import { groupNavigationLinks } from '$lib/groupNavigationLinks';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<AppShell
	navigationLinks={groupNavigationLinks}
	currentPathname={page.url.pathname}
	signedInUser={data.signedInGroupMember}
	spaceLabel={data.groupName}
	hrefsNeedingAttention={data.hrefsNeedingAttention}
	onSignOut={() => signOutAndOpen('/login')}
>
	{@render children()}
</AppShell>
