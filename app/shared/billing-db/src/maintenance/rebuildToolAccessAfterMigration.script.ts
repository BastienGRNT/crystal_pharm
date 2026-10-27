import { existsSync } from 'node:fs';
import { rebuildToolAccessOfAllTenants } from '../access/rebuildToolAccessOfTenant.server';

const repositoryEnvironmentFile = '../../../.env';

if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const rebuiltTenantCount = await rebuildToolAccessOfAllTenants();
console.log(`Accès aux Tools reconstruits pour ${rebuiltTenantCount} pharmacie(s).`);
process.exit(0);
