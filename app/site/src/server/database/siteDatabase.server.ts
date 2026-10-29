import postgres from 'postgres';

let sharedSiteDatabase: postgres.Sql | undefined;

/**
 * La connexion de `app/site` pour sa seule instruction composée de plusieurs
 * propriétaires (cf. `readSiteAccessOfSubdomain`). Les autres lectures passent par les packages `*-db`.
 */
export function connectToSiteDatabase(): postgres.Sql {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');
  sharedSiteDatabase ??= postgres(databaseUrl);
  return sharedSiteDatabase;
}
