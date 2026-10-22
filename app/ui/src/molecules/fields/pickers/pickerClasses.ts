// Les classes communes aux sélecteurs sur mesure : un même champ, une même liste ouverte.

export const pickerTriggerClasses =
	'flex h-control w-full cursor-pointer items-center gap-2 rounded-sm border border-line-strong bg-surface px-2.5 text-left text-[14px] leading-5 text-ink tabular-nums transition-[border-color,box-shadow] duration-[120ms] focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--accent-soft-value)] focus-visible:outline-none aria-expanded:border-accent';

export const pickerPopoverClasses =
	'absolute top-full left-0 z-20 mt-1 rounded-md border border-line bg-surface shadow-float';

export const pickerOptionClasses =
	'flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[14px] leading-5 text-ink data-[highlighted=true]:bg-surface-muted aria-selected:font-semibold aria-selected:text-accent-text';
