import { readRequiredEnvironmentVariable } from '@crystal-pharm/auth/toolkit';
import type { DemoSpace } from './personas/demoPersonas';

const urlVariableBySpace: Record<DemoSpace, string> = {
	pharmacy: 'PHARMACY_URL',
	group: 'GROUP_URL',
	admin: 'ADMIN_URL'
};

export function readAppUrl(space: DemoSpace): string {
	return readRequiredEnvironmentVariable(urlVariableBySpace[space]).replace(/\/$/, '');
}
