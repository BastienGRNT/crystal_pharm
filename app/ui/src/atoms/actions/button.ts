export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClasses: Record<ButtonVariant, string> = {
	primary: 'bg-accent text-on-accent hover:bg-accent-hover',
	secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-muted',
	ghost: 'bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink',
	danger: 'bg-danger text-surface hover:opacity-90'
};

/** L'allure d'un bouton, aussi pour un élément qui en joue le rôle (le libellé d'un champ de fichier). */
export function buttonClasses(variant: ButtonVariant, isFullWidth = false): string {
	return `inline-flex h-control items-center justify-center gap-1.5 rounded-sm px-3.5 text-[14px] font-semibold leading-none whitespace-nowrap no-underline transition-colors duration-[120ms] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${isFullWidth ? 'w-full' : ''}`;
}
