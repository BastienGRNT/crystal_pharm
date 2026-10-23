import { sql } from 'drizzle-orm';

// Les réglages lus par la Row-Level Security du schéma `groups`, posés par
// transaction (`runWithGroupAccess`). Un réglage absent vaut NULL : il ne donne
// accès à rien.
export const activeGroupId = sql.raw(`nullif(current_setting('app.group_id', true), '')::uuid`);
export const activeTenantId = sql.raw(`nullif(current_setting('app.tenant_id', true), '')::uuid`);
export const activeAccountId = sql.raw(`nullif(current_setting('app.account_id', true), '')`);
export const activeAccountEmail = sql.raw(`nullif(current_setting('app.account_email', true), '')`);
export const activeInvitationTokenHash = sql.raw(`nullif(current_setting('app.invitation_token_hash', true), '')`);
export const isPlatform = sql.raw(`current_setting('app.is_platform', true) = 'on'`);
