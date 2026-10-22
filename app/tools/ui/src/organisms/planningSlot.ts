/** `strong` : un créneau à repérer d'un coup d'œil (un pharmacien, par exemple) ; `soft` : les autres. */
export type PlanningSlotTone = 'strong' | 'soft';

export const planningSlotToneClasses: Record<PlanningSlotTone, string> = {
	strong: 'bg-accent font-semibold text-on-accent',
	soft: 'bg-accent-soft text-ink shadow-[inset_3px_0_0_var(--accent-value),inset_0_0_0_1px_color-mix(in_srgb,var(--accent-value)_35%,transparent)]'
};
