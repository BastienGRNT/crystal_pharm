<script lang="ts">
	import { TeamInvitationPage } from '@crystal-pharm/home';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<TeamInvitationPage {data} {form} />
