import { jsPDF } from 'jspdf';
import { Trip } from '../types';

export function generateTripPDFReceipt(trip: Trip) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [212, 175, 55]; // #D4AF37 Aron Gold
  const darkColor = [15, 20, 32];
  const slateColor = [100, 116, 139];

  // Header background banner
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 45, 'F');

  // Title
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ARON TAXI NORWAY', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.text('Org.nr: 934 123 456 MVA · Oslo, Norge', 14, 28);
  doc.text('E-post: aron.taxi@hotmail.com · Tlf: +47 96 99 09 01', 14, 34);

  // Invoice / Receipt Badge
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TURKVITTERING', 145, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text(`Kvittering ref: #${trip.id.slice(-8).toUpperCase()}`, 145, 28);
  doc.text(`Dato: ${new Date(trip.createdAt || Date.now()).toLocaleDateString('no-NO')}`, 145, 34);

  // Customer & Trip Info Box
  let y = 58;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 36, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Kundeopplysninger:', 20, y + 8);
  doc.text('Sjåfør & Kjøretøy:', 110, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(`Navn: ${trip.customerName || 'VIP Kunde'}`, 20, y + 15);
  doc.text(`Telefon: ${trip.customerPhone || 'Ikke oppgitt'}`, 20, y + 21);
  doc.text(`E-post: ${trip.customerEmail || 'Ikke oppgitt'}`, 20, y + 27);

  doc.text(`Sjåfør: ${trip.driverName || 'Aron Taxi Privatsjåfør'}`, 110, y + 15);
  doc.text(`Bil: ${trip.vehicleModel || 'Tesla Model Y / Mercedes EQE'}`, 110, y + 21);
  doc.text(`Betaling: ${trip.paymentMethod === 'card' || trip.paymentMethod === 'stripe' ? 'Kort / Stripe (Betalt)' : 'Vipps / Kort'}`, 110, y + 27);

  // Route Box
  y = 102;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 30, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Rutespesifikasjon:', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text(`Hentested: ${trip.pickup?.address || 'Oslo'}`, 20, y + 15);
  doc.text(`Destinasjon: ${trip.destination?.address || 'Gardermoen'}`, 20, y + 21);
  doc.text(`Avstand & Tid: ${trip.distanceKm || 0} km · ca ${trip.durationMinutes || 0} minutter`, 20, y + 27);

  // Price Table
  y = 142;
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(14, y, 182, 9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Beskrivelse', 20, y + 6);
  doc.text('MVA (12%)', 120, y + 6);
  doc.text('Beløp (NOK)', 160, y + 6);

  const finalPrice = trip.finalPrice || trip.estimatedPrice || 0;
  const netAmount = Math.round(finalPrice / 1.12);
  const mvaAmount = finalPrice - netAmount;

  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`Persontransport taxi (${trip.vehicleCategory === 'airport_vip' ? 'Flyplass VIP' : 'VIP Executive'})`, 20, y);
  doc.text(`${mvaAmount} kr`, 120, y);
  doc.text(`${finalPrice},00 kr`, 160, y);

  if (trip.tipAmount && trip.tipAmount > 0) {
    y += 8;
    doc.text(`Tips til sjåfør (${trip.driverName || 'Sjåfør'})`, 20, y);
    doc.text('0 kr (0%)', 120, y);
    doc.text(`${trip.tipAmount},00 kr`, 160, y);
  }

  // Summary Line
  y += 14;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Totalt innbetalt (inkl. 12% MVA):', 80, y);
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(13);
  const grandTotal = finalPrice + (trip.tipAmount || 0);
  doc.text(`${grandTotal},00 NOK`, 160, y);

  // Footer Note
  y = 260;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text('Takk for at du reiser med Aron Taxi Norway!', 105, y, { align: 'center' });
  doc.text('Dette dokumentet er gyldig som offisielt bilag for regnskap og MVA-fradrag.', 105, y + 5, { align: 'center' });

  // Save the PDF file directly to browser
  const filename = `AronTaxi_Kvittering_${trip.id.slice(-6)}.pdf`;
  doc.save(filename);
}
