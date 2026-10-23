<script lang="ts">
	import OnboardingScreen from '../../components/organisms/OnboardingScreen.svelte';
	import PharmacyContactDetailsForm from '../../components/organisms/PharmacyContactDetailsForm.svelte';
	import { emptyContactDetails, type ContactDetailsFailure } from '../pharmacyPageData';

	let { form }: { form: ContactDetailsFailure | null | undefined } = $props();
</script>

<OnboardingScreen
	currentStep="contactDetails"
	title="Votre pharmacie"
	subtitle="Bienvenue ! Présentez-nous votre officine : ces informations s’afficheront sur son site."
>
	<PharmacyContactDetailsForm
		initialContactDetails={form?.submittedContactDetails ?? emptyContactDetails}
		fieldErrors={form?.fieldErrors}
		submitLabel="Continuer"
	/>
</OnboardingScreen>
