// Les classes communes aux sélecteurs sur mesure : un même champ, une même liste ouverte.

export const pickerTriggerClasses =
	'flex h-control w-full cursor-pointer items-center gap-2 rounded-control border border-line-strong/55 bg-field px-3 text-left text-[15.5px] leading-6 text-ink tabular-nums transition-[border-color,box-shadow] duration-[120ms] focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_var(--accent-soft-value)] focus-visible:outline-none aria-expanded:border-accent';

export const pickerPopoverClasses =
	'absolute top-full left-0 z-20 mt-1.5 rounded-lg border border-line bg-surface p-1 shadow-float';

export const pickerOptionClasses =
	'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-[15.5px] leading-6 text-ink data-[highlighted=true]:bg-surface-muted aria-selected:font-semibold aria-selected:text-accent-text';
