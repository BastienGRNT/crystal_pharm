<script lang="ts">
	import { GroupInvitationPage } from '@crystal-pharm/home';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<GroupInvitationPage {data} {form} />
