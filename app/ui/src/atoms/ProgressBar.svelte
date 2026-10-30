<script lang="ts">
	type ProgressBarProps = {
		/** Ce que mesure la barre, lu par un lecteur d'écran (« Places utilisées »). */
		label: string;
		value: number;
		maximum: number;
	};

	let { label, value, maximum }: ProgressBarProps = $props();

	const filledPercentage = $derived(maximum > 0 ? Math.min(100, Math.round((value / maximum) * 100)) : 0);
	const fillClass = $derived(fillClassFor(filledPercentage));

	function fillClassFor(percentage: number): string {
		if (percentage >= 100) return 'bg-danger';
		if (percentage >= 85) return 'bg-warning';
		return 'bg-accent';
	}
</script>

<div
	role="progressbar"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={maximum}
	aria-valuenow={value}
	class="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
>
	<div class="h-full rounded-full transition-[width] duration-300 {fillClass}" style:width="{filledPercentage}%"></div>
</div>
