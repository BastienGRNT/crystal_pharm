import { describe, expect, it } from 'vitest';
import { listSiteSetupSteps, type SiteSetupFacts } from './siteSetupSteps';

const pathnames = { siteAddress: '/site-manager/adresse', siteEdition: '/site-manager/edition' };

const blankSite: SiteSetupFacts = {
	isSiteOnline: false,
	hasHeroImage: false,
	serviceCount: 0,
	shownArticleCount: 0,
	hasOpeningHours: false,
	employeeCount: 0
};

describe('listSiteSetupSteps', () => {
	it('leaves every step to do on a blank site', () => {
		const steps = listSiteSetupSteps(blankSite, pathnames);

		expect(steps.every((step) => !step.isDone)).toBe(true);
	});

	it('marks each step done from its own fact', () => {
		const steps = listSiteSetupSteps({ ...blankSite, serviceCount: 3, employeeCount: 1 }, pathnames);

		expect(steps.filter((step) => step.isDone).map((step) => step.key)).toEqual(['services', 'team']);
	});

	it('sends the site steps to the matching block of the editor', () => {
		const steps = listSiteSetupSteps(blankSite, pathnames);

		expect(steps.find((step) => step.key === 'news')?.href).toBe('/site-manager/edition#actualites');
		expect(steps.find((step) => step.key === 'address')?.href).toBe('/site-manager/adresse');
	});
});
