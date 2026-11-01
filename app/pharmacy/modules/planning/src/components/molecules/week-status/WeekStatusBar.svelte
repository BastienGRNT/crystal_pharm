<script lang="ts">
	import { Button, StatusBadge } from '@crystal-pharm/ui';

	type WeekStatusBarProps = {
		isDraft: boolean;
		publishFormAction: string;
		returnToDraftFormAction: string;
	};

	let { isDraft, publishFormAction, returnToDraftFormAction }: WeekStatusBarProps = $props();
</script>

{#if isDraft}
	<form method="POST" action={publishFormAction} class="flex flex-wrap items-center gap-2">
		<StatusBadge tone="warning">Pas encore visible par l’équipe</StatusBadge>
		<Button type="submit" icon="paper-plane-tilt">Montrer à l’équipe</Button>
	</form>
{:else}
	<form method="POST" action={returnToDraftFormAction} class="flex flex-wrap items-center gap-2">
		<StatusBadge tone="success">Visible par l’équipe</StatusBadge>
		<Button type="submit" variant="ghost" icon="arrow-counter-clockwise">Masquer pour retoucher</Button>
	</form>
{/if}
