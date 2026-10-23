<script lang="ts">
	type SwitchProps = {
		/** Le texte affiché à côté de l'interrupteur, qui peut suivre son état (« Ouvert », « Fermé »). */
		label: string;
		/** Le nom lu par un lecteur d'écran quand le texte affiché ne suffit pas seul. */
		accessibleLabel?: string;
		checked?: boolean;
	};

	let { label, accessibleLabel, checked = $bindable(false) }: SwitchProps = $props();
</script>

<label class="inline-flex cursor-pointer items-center gap-2 text-[14px] leading-5 text-ink select-none">
	<input type="checkbox" role="switch" aria-label={accessibleLabel} bind:checked class="peer sr-only" />
	<span
		aria-hidden="true"
		class="relative h-5 w-9 flex-none rounded-full bg-line-strong transition-colors duration-[120ms] peer-checked:bg-accent peer-focus-visible:shadow-[0_0_0_3px_var(--accent-soft-value)] after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-surface after:shadow-card after:transition-transform after:duration-[120ms] after:content-[''] peer-checked:after:translate-x-4"
	></span>
	<span class="min-w-[52px]">{label}</span>
</label>
