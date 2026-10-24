<script lang="ts">
	import type { LayoutSettingsField } from '@crystal-pharm/layouts/manifest';
	import { Checkbox, Field, Input, Select, Textarea } from '@crystal-pharm/ui';
	import { toLayoutSettingFieldName } from '../../domain/layoutSettingsForm';

	type LayoutSettingFieldProps = {
		settingsField: LayoutSettingsField;
		/** Du texte, ou l'état de la case pour un réglage oui / non. */
		value: string | boolean;
		errorMessage?: string;
	};

	let { settingsField, value = $bindable(), errorMessage }: LayoutSettingFieldProps = $props();

	const fieldName = $derived(toLayoutSettingFieldName(settingsField.settingKey));
	const hint = $derived(settingsField.isOptional ? 'Laissé vide, la mise en page choisit pour vous.' : undefined);

	function getText(): string {
		return typeof value === 'string' ? value : '';
	}

	function setText(text: string): void {
		value = text;
	}
</script>

{#if settingsField.kind === 'toggle'}
	<Checkbox name={fieldName} bind:checked={() => value === true, (isChecked) => (value = isChecked)}>
		{settingsField.label}
	</Checkbox>
{:else if settingsField.kind === 'choice'}
	<Field label={settingsField.label} {errorMessage}>
		{#snippet control(controlAttributes)}
			<Select {...controlAttributes} name={fieldName} bind:value={getText, setText}>
				{#if settingsField.isOptional && settingsField.defaultValue === undefined}
					<option value="">Au choix de la mise en page</option>
				{/if}
				{#each settingsField.options as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</Select>
		{/snippet}
	</Field>
{:else if settingsField.kind === 'json'}
	<Field label={settingsField.label} hint={hint ?? 'Au format JSON.'} {errorMessage}>
		{#snippet control(controlAttributes)}
			<Textarea {...controlAttributes} name={fieldName} rows={6} bind:value={getText, setText} />
		{/snippet}
	</Field>
{:else}
	<Field label={settingsField.label} {hint} {errorMessage}>
		{#snippet control(controlAttributes)}
			<Input {...controlAttributes} name={fieldName} bind:value={getText, setText} />
		{/snippet}
	</Field>
{/if}
