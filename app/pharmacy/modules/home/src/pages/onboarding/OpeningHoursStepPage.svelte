<script lang="ts">
	import { Button } from '@crystal-pharm/ui';
	import OnboardingScreen from '../../components/organisms/OnboardingScreen.svelte';
	import OpeningHoursForm from '../../components/organisms/OpeningHoursForm.svelte';
	import { homePathnames } from '../../homePathnames';
	import type { OpeningHoursFailure } from '../pharmacyPageData';

	let { form }: { form: OpeningHoursFailure | null | undefined } = $props();
</script>

<OnboardingScreen
	currentStep="openingHours"
	title="Vos horaires d’ouverture"
	subtitle="Ils s’afficheront sur votre site. Vous pourrez les modifier à tout moment depuis « Pharmacie »."
>
	<OpeningHoursForm
		initialWeeklyOpeningSchedule={undefined}
		failureMessage={form?.failureMessage}
		submitLabel="Terminer"
	>
		{#snippet secondaryAction()}
			<Button href={homePathnames.toolsHome} variant="ghost">Plus tard</Button>
		{/snippet}
	</OpeningHoursForm>
</OnboardingScreen>
