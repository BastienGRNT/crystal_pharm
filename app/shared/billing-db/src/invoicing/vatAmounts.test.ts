import { expect, it } from 'vitest';
import { addVat } from './vatAmounts';

it('ajoute 20 % de TVA, arrondie au centime', () => {
	expect(addVat(3120)).toEqual({ subtotalCents: 3120, vatCents: 624, totalCents: 3744 });
	expect(addVat(1733)).toEqual({ subtotalCents: 1733, vatCents: 347, totalCents: 2080 });
});
