<script lang="ts">
	import { Icon, type IconName } from '@crystal-pharm/ui';

	type EditorBlockRowProps = {
		icon: IconName;
		title: string;
		/** Ce que le bloc montre en ce moment (« 3 services », « Masqué »…). */
		summary: string;
		isSelected: boolean;
		/** Le point de couleur : affiché, masqué, à compléter ou en erreur ; absent pour un bloc toujours là. */
		status?: 'visible' | 'hidden' | 'attention' | 'error';
		onselect: () => void;
	};

	let { icon, title, summary, isSelected, status, onselect }: EditorBlockRowProps = $props();

	const statusClasses = { visible: 'bg-success', hidden: 'bg-line-strong', attention: 'bg-warning', error: 'bg-danger' };
</script>

<button
	type="button"
	aria-current={isSelected ? 'true' : undefined}
	data-selected={isSelected ? 'true' : undefined}
	class="group flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors duration-[120ms] hover:bg-surface-muted data-[selected=true]:bg-accent-soft"
	onclick={onselect}
>
	<span
		class="relative grid size-9 flex-none place-items-center rounded-sm bg-surface-muted text-ink-muted group-data-[selected=true]:bg-accent group-data-[selected=true]:text-on-accent"
	>
		<Icon name={icon} size={19} />
		{#if status}
			<span aria-hidden="true" class="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface {statusClasses[status]}"></span>
		{/if}
	</span>
	<span class="grid min-w-0">
		<span class="truncate text-small font-bold text-ink">{title}</span>
		<span class="truncate text-label text-ink-muted group-data-[selected=true]:text-accent-text">{summary}</span>
	</span>
</button>
