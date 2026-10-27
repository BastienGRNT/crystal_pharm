<script lang="ts">
	import { responsibilities, type ResponsibilityKey } from '@crystal-pharm/pharmacy-db/domain';
	import { Checkbox } from '@crystal-pharm/ui';
	import { responsibilityFieldName } from '../../pages/pharmacy/pharmacyPageData';

	type ResponsibilityChoicesProps = {
		/** Les cases cochées au départ. */
		selectedResponsibilityKeys: readonly ResponsibilityKey[];
	};

	let { selectedResponsibilityKeys }: ResponsibilityChoicesProps = $props();
</script>

<fieldset class="grid gap-2.5">
	<legend class="mb-1 text-[13px] leading-[18px] font-medium text-ink">Responsabilités</legend>
	{#each responsibilities as responsibility (responsibility.responsibilityKey)}
		<Checkbox
			name={responsibilityFieldName}
			value={responsibility.responsibilityKey}
			checked={selectedResponsibilityKeys.includes(responsibility.responsibilityKey)}
		>
			<span class="body-strong">{responsibility.label}</span>
			<span class="block text-ink-muted">{responsibility.description}</span>
		</Checkbox>
	{/each}
</fieldset>
