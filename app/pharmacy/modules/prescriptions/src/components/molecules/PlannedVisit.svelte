<script lang="ts">
	import { Icon } from '@crystal-pharm/ui';
	import type { PlannedVisitUrgency } from '../../domain/prescriptionQueue';

	let { label, urgency }: { label: string; urgency: PlannedVisitUrgency } = $props();

	const urgencyStyles: Record<PlannedVisitUrgency, { classes: string; suffix: string }> = {
		overdue: { classes: 'text-danger font-semibold', suffix: ' · en retard' },
		soon: { classes: 'text-warning font-semibold', suffix: ' · bientôt' },
		later: { classes: 'text-ink-muted font-medium', suffix: '' },
		whenReady: { classes: 'text-ink-subtle font-medium', suffix: '' }
	};
	const urgencyStyle = $derived(urgencyStyles[urgency]);
</script>

<p class="flex items-center gap-1.5 text-small {urgencyStyle.classes}">
	<Icon name={urgency === 'whenReady' ? 'clock-countdown' : 'clock'} size={15} class="flex-none" />
	<span class="truncate">{label}{urgencyStyle.suffix}</span>
</p>
