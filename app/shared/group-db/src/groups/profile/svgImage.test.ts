import { describe, expect, it } from 'vitest';
import { readSvgImage } from './svgImage';

function toBytes(text: string): Uint8Array {
	return new TextEncoder().encode(text);
}

const circle = '<circle cx="5" cy="5" r="4" fill="#0a7"/>';

describe('readSvgImage', () => {
	it.each([
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${circle}</svg>`,
		`<?xml version="1.0" encoding="UTF-8"?>\n<!-- Generator: Adobe Illustrator -->\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg viewBox="0 0 10 10">${circle}</svg>`,
		`<svg><defs><linearGradient id="g"/></defs><rect fill="url(#g)" width="10" height="10"/><use href="#g" xlink:href="#g"/></svg>`,
		'<svg><image href="data:image/png;base64,iVBORw0KGgo="/></svg>'
	])('accepte un dessin sans code ni lien externe', (svg) => {
		expect(readSvgImage(toBytes(svg))).toBe('safe');
	});

	it.each(['', 'pas une image', '<html><svg></svg></html>', '<svgfoo></svgfoo>'])('ne reconnaît pas « %s » comme un SVG', (text) => {
		expect(readSvgImage(toBytes(text))).toBe('not-svg');
	});

	it('ne reconnaît pas un fichier qui n’est pas du texte', () => {
		expect(readSvgImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0xff, 0xfe]))).toBe('not-svg');
	});

	it.each([
		'<svg><script>alert(1)</script></svg>',
		'<svg><svg:script>alert(1)</svg:script></svg>',
		'<svg onload="alert(1)"></svg>',
		'<svg><rect ONCLICK = "alert(1)"/></svg>',
		'<svg><foreignObject><div/></foreignObject></svg>',
		'<svg><a href="javascript:alert(1)"><rect/></a></svg>',
		'<svg><a xlink:href="&#106;avascript:alert(1)"><rect/></a></svg>',
		'<svg><image href="https://exemple.fr/pisteur.png"/></svg>',
		'<svg><image href="data:image/svg+xml;base64,PHN2Zz4="/></svg>',
		'<svg><a><set attributeName="href" to="javascript:alert(1)"/></a></svg>',
		'<svg><style>@import "https://exemple.fr/style.css";</style></svg>',
		'<svg><rect style="fill: url(https://exemple.fr/pisteur)"/></svg>',
		'<!DOCTYPE svg [<!ENTITY lol "lol">]><svg>&lol;</svg>'
	])('refuse « %s »', (svg) => {
		expect(readSvgImage(toBytes(svg))).toBe('unsafe');
	});
});
