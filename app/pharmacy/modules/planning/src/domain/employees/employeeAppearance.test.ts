import { describe, expect, it } from 'vitest';
import { assignEmployeeColorIndexes, employeeColorCount, formatEmployeeInitials } from './employeeAppearance';

describe('formatEmployeeInitials', () => {
	it('prend la première lettre du prénom et du nom', () => {
		expect(formatEmployeeInitials('Camille Martin')).toBe('CM');
		expect(formatEmployeeInitials('Jean-Marc de la Tour')).toBe('JT');
	});

	it('garde deux lettres pour un seul mot', () => {
		expect(formatEmployeeInitials('Inès')).toBe('IN');
	});

	it('ignore les espaces en trop et met en majuscules', () => {
		expect(formatEmployeeInitials('  léa   dubois ')).toBe('LD');
	});
});

describe('assignEmployeeColorIndexes', () => {
	it('donne la même teinte quel que soit l’ordre d’affichage', () => {
		const first = assignEmployeeColorIndexes(['b', 'a', 'c']);
		const second = assignEmployeeColorIndexes(['c', 'b', 'a']);
		expect([...first.entries()].sort()).toEqual([...second.entries()].sort());
	});

	it('donne des teintes différentes tant que l’équipe tient dans la palette', () => {
		const employeeIds = Array.from({ length: employeeColorCount }, (_, index) => `employee-${index}`);
		const colorIndexes = new Set(assignEmployeeColorIndexes(employeeIds).values());
		expect(colorIndexes.size).toBe(employeeColorCount);
	});

	it('fait revenir les teintes au-delà de la palette', () => {
		const employeeIds = Array.from({ length: employeeColorCount + 1 }, (_, index) => `employee-${index}`);
		const colorIndexes = [...assignEmployeeColorIndexes(employeeIds).values()];
		expect(Math.max(...colorIndexes)).toBe(employeeColorCount - 1);
	});
});
