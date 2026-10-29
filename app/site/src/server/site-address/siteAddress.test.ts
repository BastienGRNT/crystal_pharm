import { describe, expect, it } from 'vitest';
import { findSubdomainOfHost, toCurrentAddress } from './siteAddress';

describe('findSubdomainOfHost', () => {
  it('lit le sous-domaine, avec ou sans port, quelle que soit la casse', () => {
    expect(findSubdomainOfHost('pharmacie-du-port.site.localhost:8080', 'site.localhost')).toBe('pharmacie-du-port');
    expect(findSubdomainOfHost('Pharmacie-Du-Port.SITE.localhost', 'site.localhost')).toBe('pharmacie-du-port');
  });

  it('ignore un Host hors du domaine des sites', () => {
    expect(findSubdomainOfHost('apercu.localhost:8080', 'site.localhost')).toBeUndefined();
    expect(findSubdomainOfHost('site.localhost', 'site.localhost')).toBeUndefined();
    expect(findSubdomainOfHost('pharmacie.site.localhost.exemple.fr', 'site.localhost')).toBeUndefined();
    expect(findSubdomainOfHost(null, 'site.localhost')).toBeUndefined();
  });

  it('refuse un sous-domaine à plusieurs niveaux ou aux caractères étrangers', () => {
    expect(findSubdomainOfHost('a.b.site.localhost', 'site.localhost')).toBeUndefined();
    expect(findSubdomainOfHost('a_b.site.localhost', 'site.localhost')).toBeUndefined();
  });
});

describe('toCurrentAddress', () => {
  const request = (url: string) => ({ url, hostHeader: 'ancien.site.localhost:8080', isSecure: false });

  it('garde le chemin et la requête sur l’adresse actuelle', () => {
    expect(toCurrentAddress(request('http://ancien.site.localhost:8080/services?onglet=2'), 'actuel', 'site.localhost')).toBe(
      'http://actuel.site.localhost:8080/services?onglet=2',
    );
  });

  it('ramène à l’accueil un chemin qui commence par //', () => {
    expect(toCurrentAddress(request('http://ancien.site.localhost:8080//exemple.fr/piege'), 'actuel', 'site.localhost')).toBe(
      'http://actuel.site.localhost:8080/',
    );
  });

  it('garde https', () => {
    expect(toCurrentAddress({ url: 'https://ancien.site.fr/', hostHeader: 'ancien.site.fr', isSecure: true }, 'actuel', 'site.fr')).toBe('https://actuel.site.fr/');
  });
});
