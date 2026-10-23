<script lang="ts">
	import { PublicInvitationPage } from '@crystal-pharm/home';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PublicInvitationPage {data} />
