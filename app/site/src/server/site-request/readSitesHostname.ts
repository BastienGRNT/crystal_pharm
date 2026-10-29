export function readSitesHostname(): string {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) throw new Error('SITE_URL is missing from the environment.');
  return new URL(siteUrl).hostname;
}
