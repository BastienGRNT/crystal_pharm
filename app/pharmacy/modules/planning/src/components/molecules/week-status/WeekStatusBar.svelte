<script lang="ts">
	import { Alert, Button } from '@crystal-pharm/ui';

	type WeekStatusBarProps = {
		isDraft: boolean;
		publishFormAction: string;
		returnToDraftFormAction: string;
	};

	let { isDraft, publishFormAction, returnToDraftFormAction }: WeekStatusBarProps = $props();
</script>

{#if isDraft}
	<Alert tone="warning" title="Brouillon">
		<form method="POST" action={publishFormAction} class="flex flex-wrap items-center gap-x-4 gap-y-2">
			<span>Votre équipe ne voit pas encore cette semaine. Ajustez-la, puis publiez-la.</span>
			<Button type="submit" icon="paper-plane-tilt">Publier la semaine</Button>
		</form>
	</Alert>
{:else}
	<form method="POST" action={returnToDraftFormAction}>
		<Button type="submit" variant="ghost" icon="arrow-counter-clockwise">Repasser en brouillon</Button>
	</form>
{/if}
