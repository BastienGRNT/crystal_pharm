<script lang="ts">
	import { Icon, type IconName } from '@crystal-pharm/ui';

	type EditorRailItemProps = {
		icon: IconName;
		label: string;
		isSelected: boolean;
		/** Le point de couleur : affiché, masqué, à compléter ou en erreur ; absent pour un bloc sans état. */
		status?: 'visible' | 'hidden' | 'attention' | 'error';
		onselect: () => void;
	};

	let { icon, label, isSelected, status, onselect }: EditorRailItemProps = $props();

	const statusClasses = { visible: 'bg-success', hidden: 'bg-line-strong', attention: 'bg-warning', error: 'bg-danger' };
</script>

<button
	type="button"
	aria-current={isSelected ? 'true' : undefined}
	class="relative flex min-w-[76px] flex-none cursor-pointer flex-col items-center gap-1 rounded-md px-1 py-2.5 text-[12px] leading-4 font-medium text-ink-muted hover:bg-surface-muted hover:text-ink aria-[current=true]:bg-accent-soft aria-[current=true]:text-accent-text"
	onclick={onselect}
>
	<Icon name={icon} size={24} />
	<span class="text-center">{label}</span>
	{#if status}
		<span aria-hidden="true" class="absolute top-2 right-3 size-2 rounded-full {statusClasses[status]}"></span>
	{/if}
</button>
