<script lang="ts">
	import { onMount } from 'svelte';
	import LogoMark from '../../atoms/LogoMark.svelte';
	import Alert from '../../molecules/Alert.svelte';

	type DeveloperSignInScreenProps = {
		accountLabel: string;
		/** Connecte le compte et ouvre l'app ; renvoie le message d'échec, s'il y en a un. */
		signIn: () => Promise<string | undefined>;
	};

	let { accountLabel, signIn }: DeveloperSignInScreenProps = $props();

	let failureMessage = $state<string | undefined>();

	onMount(async () => {
		failureMessage = await signIn();
	});
</script>

<svelte:head>
	<title>Connexion de démo · Crystal Pharm</title>
</svelte:head>

<main class="grid min-h-screen place-items-center bg-app px-6 font-sans text-ink">
	<div class="grid max-w-sm justify-items-center gap-4 text-center">
		<LogoMark size={40} />
		<p class="title-1">Connexion à « {accountLabel} »…</p>
		{#if failureMessage}
			<Alert tone="danger">{failureMessage}</Alert>
		{/if}
	</div>
</main>
