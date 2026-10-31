import { describe, expect, it } from 'vitest';
import { readAppointmentConfigurationForm } from './appointmentConfigurationForm';

const formWith = (configuration: string): FormData => {
	const formData = new FormData();
	formData.set('configuration', configuration);
	return formData;
};

describe('la lecture du formulaire des réglages', () => {
	it('reads a configuration with the four expected parts', () => {
		const reading = readAppointmentConfigurationForm(
			formWith(JSON.stringify({ settings: {}, reasons: [], weeklyAvailability: [], closures: [] }))
		);

		expect(reading.isValid).toBe(true);
	});

	it('refuses text that is not JSON', () => {
		expect(readAppointmentConfigurationForm(formWith('pas du json')).isValid).toBe(false);
	});

	it('refuses a configuration missing a part', () => {
		expect(readAppointmentConfigurationForm(formWith(JSON.stringify({ settings: {}, reasons: [] }))).isValid).toBe(false);
	});
});
