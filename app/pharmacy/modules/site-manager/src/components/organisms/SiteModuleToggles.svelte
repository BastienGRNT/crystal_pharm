<script lang="ts">
	import type { ModuleName } from '@crystal-pharm/schema';
	import { Tag, TextLink, ToggleCard } from '@crystal-pharm/ui';
	import type { SiteModuleChoice } from '../../domain/siteModuleChoices';

	type SiteModuleTogglesProps = {
		moduleChoices: SiteModuleChoice[];
		/** Les modules cochés par le Manager ; ceux du groupement s'ajoutent d'eux-mêmes. */
		enabledModules: ModuleName[];
	};

	let { moduleChoices, enabledModules = $bindable() }: SiteModuleTogglesProps = $props();

	function isChecked(moduleChoice: SiteModuleChoice): boolean {
		if (moduleChoice.state.kind === 'mandatory') return true;
		if (moduleChoice.state.kind === 'unavailable') return false;
		return enabledModules.includes(moduleChoice.moduleName);
	}

	function setChecked(moduleName: ModuleName, isNowChecked: boolean): void {
		const otherModules = enabledModules.filter((enabledModule) => enabledModule !== moduleName);
		enabledModules = isNowChecked ? [...otherModules, moduleName] : otherModules;
	}
</script>

<div class="grid gap-3">
	{#each moduleChoices as moduleChoice (moduleChoice.moduleName)}
		<ToggleCard
			name="enabledModules"
			value={moduleChoice.moduleName}
			title={moduleChoice.title}
			description={moduleChoice.description}
			disabled={moduleChoice.state.kind !== 'optional'}
			bind:checked={() => isChecked(moduleChoice), (isNowChecked) => setChecked(moduleChoice.moduleName, isNowChecked)}
		>
			{#snippet footer()}
				{#if moduleChoice.state.kind === 'mandatory'}
					<span><Tag tone="accent">Imposé par {moduleChoice.state.groupName}</Tag></span>
				{:else if moduleChoice.state.kind === 'unavailable'}
					<span class="text-small text-ink-muted">
						{moduleChoice.state.reason}
						{#if moduleChoice.state.fixHref}
							<TextLink href={moduleChoice.state.fixHref}>Y aller</TextLink>
						{/if}
					</span>
				{/if}
			{/snippet}
		</ToggleCard>
	{/each}
</div>
