/** « 04 78 42 15 30 » devient « tel:0478421530 », que tous les téléphones savent composer. */
export function telephoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
