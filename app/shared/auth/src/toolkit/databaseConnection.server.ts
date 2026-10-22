import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readRequiredEnvironmentVariable } from './environment.server';

export function connectToDatabase() {
	return drizzle(postgres(readRequiredEnvironmentVariable('DATABASE_URL')));
}
