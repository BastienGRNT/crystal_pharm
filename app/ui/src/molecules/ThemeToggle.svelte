<script lang="ts">
	import { onMount } from 'svelte';
	import IconButton from '../atoms/actions/IconButton.svelte';
	import { applyAndRememberTheme, readCurrentTheme, type Theme } from './themePreference';

	let { surface = 'page' }: { surface?: 'page' | 'rail' } = $props();

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
	<IconButton icon="sun" label="Passer au thème clair" {surface} onclick={switchTheme} />
{:else}
	<IconButton icon="moon" label="Passer au thème sombre" {surface} onclick={switchTheme} />
{/if}
