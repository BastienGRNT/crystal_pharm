/** Les classes de chaque teinte de `ui`, écrites en entier pour que Tailwind les trouve. */
type EmployeeColorClasses = {
	/** Un créneau de pharmacien, la pastille des initiales. */
	strong: string;
	/** Un créneau des autres employés. */
	soft: string;
	/** Le bouton de l'employé choisi. */
	selected: string;
};

const employeeColorClassesByIndex: EmployeeColorClasses[] = [
	{ strong: 'bg-category-1 text-on-category', soft: 'bg-category-1-soft text-category-1 shadow-[inset_0_0_0_1px_var(--category-1)]', selected: 'border-category-1 bg-category-1-soft' },
	{ strong: 'bg-category-2 text-on-category', soft: 'bg-category-2-soft text-category-2 shadow-[inset_0_0_0_1px_var(--category-2)]', selected: 'border-category-2 bg-category-2-soft' },
	{ strong: 'bg-category-3 text-on-category', soft: 'bg-category-3-soft text-category-3 shadow-[inset_0_0_0_1px_var(--category-3)]', selected: 'border-category-3 bg-category-3-soft' },
	{ strong: 'bg-category-4 text-on-category', soft: 'bg-category-4-soft text-category-4 shadow-[inset_0_0_0_1px_var(--category-4)]', selected: 'border-category-4 bg-category-4-soft' },
	{ strong: 'bg-category-5 text-on-category', soft: 'bg-category-5-soft text-category-5 shadow-[inset_0_0_0_1px_var(--category-5)]', selected: 'border-category-5 bg-category-5-soft' },
	{ strong: 'bg-category-6 text-on-category', soft: 'bg-category-6-soft text-category-6 shadow-[inset_0_0_0_1px_var(--category-6)]', selected: 'border-category-6 bg-category-6-soft' },
	{ strong: 'bg-category-7 text-on-category', soft: 'bg-category-7-soft text-category-7 shadow-[inset_0_0_0_1px_var(--category-7)]', selected: 'border-category-7 bg-category-7-soft' }
];

export function readEmployeeColorClasses(colorIndex: number | undefined): EmployeeColorClasses {
	return employeeColorClassesByIndex[(colorIndex ?? 0) % employeeColorClassesByIndex.length] ?? employeeColorClassesByIndex[0]!;
}

/** Plein pour un pharmacien, qu'on repère d'un coup d'œil ; teinté pour les autres. */
export function readShiftBlockClasses(colorIndex: number | undefined, isPharmacist: boolean): string {
	const classes = readEmployeeColorClasses(colorIndex);
	return isPharmacist ? `${classes.strong} font-semibold` : classes.soft;
}
