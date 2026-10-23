<script lang="ts">
	import { signInAndOpen } from '@crystal-pharm/auth/client';
	import { DeveloperSignInScreen } from '@crystal-pharm/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<DeveloperSignInScreen accountLabel={data.accountLabel} signIn={() => signInAndOpen(data.credentials, '/')} />
