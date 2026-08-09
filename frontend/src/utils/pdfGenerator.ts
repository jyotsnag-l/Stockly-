import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Challan } from '../api/challans';

export const exportChallanToPDF = (challan: Challan) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Color Palette
  const colors = {
    primary: [16, 42, 67],      // Navy (#102A43)
    secondary: [23, 107, 77],   // Emerald (#176B4D)
    textPrimary: [23, 33, 43],  // Dark text (#17212B)
    textMuted: [102, 112, 133], // Grey (#667085)
    bgLight: [247, 246, 242],   // Ivory (#F7F6F2)
    border: [229, 231, 235]     // Light Grey (#E5E7EB)
  };

  // Header / Branding
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  // Draw a sleek top accent line
  doc.rect(0, 0, 210, 4, 'F');

  // Title: "DELIVERY CHALLAN"
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('DELIVERY CHALLAN', 20, 25);

  // Brand Name: "STOCKLY"
  doc.setFontSize(16);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.text('STOCKLY', 190 - doc.getTextWidth('STOCKLY'), 25);
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('Run your business with clarity', 190 - doc.getTextWidth('Run your business with clarity'), 29);

  // Horizontal divider
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);

  // Metadata block (Left: Challan info, Right: Creator/Date)
  doc.setFontSize(9);
  
  // Left Column
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('CHALLAN REFERENCE', 20, 43);
  doc.setFontSize(12);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(challan.challanNumber, 20, 49);

  // Status Badge
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('Status:', 20, 56);
  
  doc.setFont('Helvetica', 'bold');
  if (challan.status === 'Confirmed') {
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]); // Green
  } else if (challan.status === 'Draft') {
    doc.setTextColor(183, 121, 31); // Warning Orange (#B7791F)
  } else {
    doc.setTextColor(201, 74, 74); // Danger Red (#C94A4A)
  }
  doc.text(challan.status, 32, 56);

  // Right Column (Date / Issued By)
  const dateStr = new Date(challan.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('DATE & TIME', 120, 43);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(dateStr, 120, 49);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('ISSUED BY', 120, 56);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(challan.createdByUser?.name || 'System Operator', 140, 56);

  // Horizontal divider
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.line(20, 62, 190, 62);

  // Client Details Section (Shipped To)
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('SHIPPED TO / CLIENT DETAILS', 20, 70);

  // Client Name & Business Name
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(challan.customer?.name || 'N/A', 20, 77);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(challan.customer?.businessName || '', 20, 82);

  // Contact details (Email, Phone)
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('Email:', 20, 89);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(challan.customer?.email || 'N/A', 32, 89);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('Phone:', 20, 94);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(challan.customer?.mobile || 'N/A', 32, 94);

  // Address (Wrapped Text)
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('Address:', 120, 77);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  const addressLines = doc.splitTextToSize(challan.customer?.address || 'N/A', 70);
  doc.text(addressLines, 120, 82);

  // Generate Table of Items using jspdf-autotable
  const tableData = challan.items.map((item) => {
    const price = Number(item.unitPriceSnapshot);
    const subtotal = price * item.quantity;
    return [
      item.productNameSnapshot,
      item.productSkuSnapshot,
      `Rs. ${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${item.quantity} units`,
      `Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ];
  });

  const tableHeaders = [['Product Name', 'SKU', 'Unit Price', 'Quantity', 'Subtotal']];

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 105,
    margin: { left: 20, right: 20 },
    styles: {
      font: 'Helvetica',
      fontSize: 9,
      cellPadding: 4,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [16, 42, 67], // Navy theme
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { cellWidth: 35, fontStyle: 'normal' },
      2: { cellWidth: 25, halign: 'left' },
      3: { cellWidth: 25, halign: 'left' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    theme: 'striped'
  });

  // Calculate totals
  const totalValuation = challan.items.reduce(
    (sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity,
    0
  );

  // Get Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Running Total Card / Block
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.5);
  doc.line(20, finalY, 190, finalY);

  // Left totals (quantity)
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('Total Shipped Quantity:', 20, finalY + 8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(`${challan.totalQuantity} pcs`, 20, finalY + 14);

  // Right totals (valuation)
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  const valuationLabel = 'Challan Valuation:';
  doc.text(valuationLabel, 190 - doc.getTextWidth(valuationLabel), finalY + 8);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]); // Emerald Green
  const valStr = `Rs. ${totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  doc.text(valStr, 190 - doc.getTextWidth(valStr), finalY + 15);

  // Signatures Section (at the bottom, or relative if fits, otherwise on a new page or push down)
  let sigY = finalY + 35;
  if (sigY > 265) {
    // If it exceeds page boundaries, add a page
    doc.addPage();
    sigY = 30;
  }

  // Draw two signature lines
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.5);
  doc.line(20, sigY, 75, sigY);
  doc.line(135, sigY, 190, sigY);

  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text('PREPARED BY', 20, sigY + 5);
  doc.text('CUSTOMER ACKNOWLEDGEMENT', 135, sigY + 5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorized Signatory', 20, sigY + 9);
  doc.text('Sign & Stamp', 135, sigY + 9);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  const footerText = 'Thank you for doing business with Stockly!';
  doc.text(footerText, 105 - (doc.getTextWidth(footerText) / 2), 285);

  // Save the PDF
  doc.save(`Challan_${challan.challanNumber}.pdf`);
};
