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
	<form method="POST" action={publishFormAction} class="flex items-center gap-2">
		<span title="Votre équipe ne voit pas encore cette semaine."><StatusBadge tone="warning">Brouillon</StatusBadge></span>
		<Button type="submit" icon="paper-plane-tilt">Publier la semaine</Button>
	</form>
{:else}
	<form method="POST" action={returnToDraftFormAction} class="flex items-center gap-2">
		<StatusBadge tone="success">Publiée</StatusBadge>
		<Button type="submit" variant="ghost" icon="arrow-counter-clockwise">Repasser en brouillon</Button>
	</form>
{/if}
