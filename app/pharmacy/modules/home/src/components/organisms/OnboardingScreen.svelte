<script lang="ts">
	import { signOutAndOpen } from '@crystal-pharm/auth/client';
	import { IconButton, SetupScreen } from '@crystal-pharm/ui';
	import type { Snippet } from 'svelte';
	import { homePathnames } from '../../homePathnames';
	import { pharmacyAuthenticationSpace } from '../../pharmacyAuthenticationSpace';

	type OnboardingStep = 'contactDetails' | 'openingHours';

	type OnboardingScreenProps = {
		currentStep: OnboardingStep;
		title: string;
		subtitle: string;
		children: Snippet;
	};

	let { currentStep, title, subtitle, children }: OnboardingScreenProps = $props();

	const onboardingSteps: readonly OnboardingStep[] = ['contactDetails', 'openingHours'];
	const onboardingStepLabels: Record<OnboardingStep, string> = {
		contactDetails: 'Votre pharmacie',
		openingHours: 'Horaires d’ouverture'
	};
</script>

<SetupScreen
	spaceLabel={pharmacyAuthenticationSpace.label}
	steps={onboardingSteps.map((onboardingStep) => onboardingStepLabels[onboardingStep])}
	currentStepIndex={onboardingSteps.indexOf(currentStep)}
	{title}
	{subtitle}
>
	{#snippet headerActions()}
		<IconButton icon="sign-out" label="Se déconnecter" surface="rail" onclick={() => signOutAndOpen(homePathnames.login)} />
	{/snippet}
	{@render children()}
</SetupScreen>
