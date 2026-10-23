import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { formatEuros } from '../money/euroAmount';
import { readInvoiceIssuer } from './invoiceIssuer';
import type { Invoice } from './invoices.server';

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 50;
const inkColor = rgb(0.08, 0.14, 0.17);
const mutedColor = rgb(0.3, 0.37, 0.41);
const lineColor = rgb(0.88, 0.91, 0.92);
const accentColor = rgb(0.05, 0.49, 0.42);

const dayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

type PdfWriter = { page: PDFPage; regularFont: PDFFont; boldFont: PDFFont };

/** La facture (ou l'avoir) en PDF A4, telle qu'on la télécharge. */
export async function renderInvoicePdf(invoice: Invoice): Promise<Uint8Array> {
	const document = await PDFDocument.create();
	document.setTitle(`${describeKind(invoice)} ${invoice.number}`);
	document.setAuthor(readInvoiceIssuer().name);
	const writer: PdfWriter = {
		page: document.addPage([pageWidth, pageHeight]),
		regularFont: await document.embedFont(StandardFonts.Helvetica),
		boldFont: await document.embedFont(StandardFonts.HelveticaBold)
	};

	writeIssuerAndTitle(writer, invoice);
	writeCustomer(writer, invoice);
	const tableBottom = writeLines(writer, invoice, 560);
	writeTotals(writer, invoice, tableBottom - 18);
	writeSettlement(writer, invoice);
	return document.save();
}

function writeIssuerAndTitle(writer: PdfWriter, invoice: Invoice): void {
	const issuer = readInvoiceIssuer();
	let issuerTop = pageHeight - margin;
	writeText(writer, issuer.name, margin, issuerTop, { size: 18, isBold: true, color: accentColor });
	for (const issuerLine of [...issuer.addressLines, ...issuer.legalMentions]) {
		issuerTop -= 14;
		writeText(writer, issuerLine, margin, issuerTop, { size: 9, color: mutedColor });
	}

	const titleRight = pageWidth - margin;
	writeTextRightAligned(writer, describeKind(invoice).toUpperCase(), titleRight, pageHeight - margin, { size: 18, isBold: true });
	writeTextRightAligned(writer, `N° ${invoice.number}`, titleRight, pageHeight - margin - 20, { size: 10 });
	writeTextRightAligned(writer, `${invoice.kind === 'credit_note' ? 'Émis' : 'Émise'} le ${dayFormat.format(invoice.issuedAt)}`, titleRight, pageHeight - margin - 34, { size: 10 });
	if (invoice.periodStart && invoice.periodEnd) {
		const periodText = `Période du ${dayFormat.format(invoice.periodStart)} au ${dayFormat.format(new Date(invoice.periodEnd.getTime() - 1))}`;
		writeTextRightAligned(writer, periodText, titleRight, pageHeight - margin - 48, { size: 10, color: mutedColor });
	}
}

function writeCustomer(writer: PdfWriter, invoice: Invoice): void {
	const customerLeft = pageWidth / 2 + 20;
	let customerTop = pageHeight - 170;
	writeText(writer, 'Facturé à', customerLeft, customerTop, { size: 9, color: mutedColor });
	customerTop -= 16;
	writeText(writer, invoice.customerName, customerLeft, customerTop, { size: 12, isBold: true });
	for (const addressLine of invoice.customerAddressLines) {
		customerTop -= 14;
		writeText(writer, addressLine, customerLeft, customerTop, { size: 10 });
	}
}

/** Renvoie la hauteur sous la dernière ligne. */
function writeLines(writer: PdfWriter, invoice: Invoice, tableTop: number): number {
	const amountRight = pageWidth - margin;
	writeText(writer, 'Désignation', margin, tableTop, { size: 9, isBold: true, color: mutedColor });
	writeTextRightAligned(writer, 'Montant HT', amountRight, tableTop, { size: 9, isBold: true, color: mutedColor });
	let lineTop = tableTop - 8;
	drawRule(writer, lineTop);
	for (const line of invoice.lines) {
		lineTop -= 20;
		writeText(writer, line.label, margin, lineTop, { size: 10 });
		writeTextRightAligned(writer, formatEuros(line.amountCents), amountRight, lineTop, { size: 10 });
		lineTop -= 8;
		drawRule(writer, lineTop);
	}
	return lineTop;
}

function writeTotals(writer: PdfWriter, invoice: Invoice, totalsTop: number): void {
	const labelLeft = pageWidth / 2 + 20;
	const amountRight = pageWidth - margin;
	const totalRows: [string, number, boolean][] = [
		['Total HT', invoice.subtotalCents, false],
		[`TVA (${invoice.vatRatePercent} %)`, invoice.vatCents, false],
		['Total TTC', invoice.totalCents, true]
	];
	totalRows.forEach(([label, amountCents, isBold], rowIndex) => {
		const rowTop = totalsTop - rowIndex * 18;
		writeText(writer, label, labelLeft, rowTop, { size: isBold ? 12 : 10, isBold });
		writeTextRightAligned(writer, formatEuros(amountCents), amountRight, rowTop, { size: isBold ? 12 : 10, isBold });
	});
}

function writeSettlement(writer: PdfWriter, invoice: Invoice): void {
	const settlementText =
		invoice.kind === 'credit_note'
			? `Avoir annulant la facture N° ${invoice.creditedInvoiceNumber ?? ''} : le montant a été remboursé sur le moyen de paiement utilisé.`
			: invoice.status === 'paid'
				? `Payée${invoice.paymentMethod === 'card' ? ' par carte' : ' par virement'}${invoice.paidAt ? ` le ${dayFormat.format(invoice.paidAt)}` : ''}.`
				: invoice.status === 'credited'
					? 'Facture annulée par un avoir (remboursement).'
					: 'À régler par virement sous 30 jours, en rappelant le numéro de facture.';
	writeText(writer, settlementText, margin, 120, { size: 10, isBold: true });
	writeText(writer, 'Pas d’escompte pour paiement anticipé. Indemnité forfaitaire pour frais de recouvrement en cas de retard : 40 €.', margin, 100, {
		size: 8,
		color: mutedColor
	});
}

function describeKind(invoice: Invoice): string {
	return invoice.kind === 'credit_note' ? 'Avoir' : 'Facture';
}

type TextStyle = { size: number; isBold?: boolean; color?: ReturnType<typeof rgb> };

function writeText(writer: PdfWriter, text: string, left: number, baseline: number, style: TextStyle): void {
	const font = style.isBold ? writer.boldFont : writer.regularFont;
	writer.page.drawText(toEncodableText(text, font), { x: left, y: baseline, size: style.size, font, color: style.color ?? inkColor });
}

function writeTextRightAligned(writer: PdfWriter, text: string, right: number, baseline: number, style: TextStyle): void {
	const font = style.isBold ? writer.boldFont : writer.regularFont;
	const encodableText = toEncodableText(text, font);
	writeText(writer, encodableText, right - font.widthOfTextAtSize(encodableText, style.size), baseline, style);
}

function drawRule(writer: PdfWriter, height: number): void {
	writer.page.drawLine({ start: { x: margin, y: height }, end: { x: pageWidth - margin, y: height }, thickness: 0.5, color: lineColor });
}

// Les polices standard du PDF ne connaissent que l'alphabet WinAnsi : les espaces
// fines d'Intl et le signe moins typographique y sont remplacés.
function toEncodableText(text: string, font: PDFFont): string {
	return [...text.replace(/[  ]/g, ' ').replace(/−/g, '-')]
		.map((character) => {
			try {
				font.widthOfTextAtSize(character, 10);
				return character;
			} catch {
				return '?';
			}
		})
		.join('');
}
