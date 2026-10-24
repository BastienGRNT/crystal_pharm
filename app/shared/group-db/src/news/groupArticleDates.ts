// Un jour de publication est rangé à midi UTC : c'est le même jour à Paris, été comme hiver.
export function toPublicationInstant(publicationDay: string): Date {
	return new Date(`${publicationDay}T12:00:00Z`);
}

export function toParisCalendarDate(instant: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(instant);
}
