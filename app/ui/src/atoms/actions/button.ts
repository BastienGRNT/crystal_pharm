export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
/** `compact` : dans une ligne de liste, à côté du texte qu'il traite. */
export type ButtonSize = 'regular' | 'compact';

const sizeClasses: Record<ButtonSize, string> = {
	regular: 'h-control px-4 text-[15px]',
	compact: 'h-control-sm px-3 text-[14px]'
};

// Un liseré plus sombre sous les boutons pleins : ils se lisent comme des touches qu'on enfonce.
const variantClasses: Record<ButtonVariant, string> = {
	primary: 'bg-accent text-on-accent shadow-press hover:bg-accent-hover',
	secondary: 'border border-line-strong/60 bg-surface text-ink shadow-card hover:border-line-strong hover:bg-surface-subtle',
	ghost: 'bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink',
	danger: 'bg-danger text-surface shadow-press hover:opacity-90'
};

/** L'allure d'un bouton, aussi pour un élément qui en joue le rôle (le libellé d'un champ de fichier). */
export function buttonClasses(variant: ButtonVariant, isFullWidth = false, size: ButtonSize = 'regular'): string {
	return `inline-flex items-center justify-center gap-2 rounded-control ${sizeClasses[size]} font-bold leading-none whitespace-nowrap no-underline transition-[background-color,border-color,transform] duration-[120ms] cursor-pointer active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 ${variantClasses[variant]} ${isFullWidth ? 'w-full' : ''}`;
}
