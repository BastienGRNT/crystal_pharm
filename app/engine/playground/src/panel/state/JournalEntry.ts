export type JournalLevel = 'error' | 'warning' | 'info';

export type JournalEntry = { entryId: number; loggedAt: Date; level: JournalLevel; source: string; text: string };
