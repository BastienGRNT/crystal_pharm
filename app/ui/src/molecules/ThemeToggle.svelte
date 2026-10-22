<script lang="ts">
	import { onMount } from 'svelte';
	import IconButton from '../atoms/IconButton.svelte';
	import { applyAndRememberTheme, readCurrentTheme, type Theme } from '../theme/themePreference';

	let currentTheme = $state<Theme>('light');

	onMount(() => {
		currentTheme = readCurrentTheme();
	});

	function switchTheme() {
		currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
		applyAndRememberTheme(currentTheme);
	}
</script>

{#if currentTheme === 'dark'}
	<IconButton icon="sun" label="Passer au thème clair" onclick={switchTheme} />
{:else}
	<IconButton icon="moon" label="Passer au thème sombre" onclick={switchTheme} />
{/if}
