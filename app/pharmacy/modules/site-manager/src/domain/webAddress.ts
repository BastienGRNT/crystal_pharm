import * as v from 'valibot';

const WebAddressSchema = v.pipe(v.string(), v.url(), v.maxLength(2000));

export function isValidWebAddress(text: string): boolean {
	return v.is(WebAddressSchema, text.trim());
}
