<script lang="ts">
	import { page } from '$app/state';
	import { ErrorScreen } from '@crystal-pharm/ui';
</script>

<ErrorScreen status={page.status} message={page.error?.message} homeHref="/" isFullPage />
