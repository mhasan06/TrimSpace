import { jsPDF } from "jspdf";
import "jspdf-autotable";

export interface InvoiceData {
  bookingId: string;
  customerName: string;
  tenantName: string;
  tenantAddress: string;
  tenantPhone: string;
  tenantABN: string;
  date: string;
  time: string;
  services: { name: string; price: number }[];
  totalPrice: number;
}

export async function generateTaxInvoice(data: InvoiceData): Promise<Blob> {
  // Use a default for ABN if missing
  const abn = data.tenantABN || "00 000 000 000";
  const basePrice = data.totalPrice; 
  const priorityFee = 0.50; 
  const totalAmount = basePrice + priorityFee;

  const doc = new jsPDF() as any;

  // 1. Dual Header Branding
  // Top Left: TrimSpace
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // Navy
  doc.setFont("helvetica", "bold");
  doc.text("TrimSpace", 20, 25);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("PREMIUM MARKETPLACE", 20, 30);

  // Top Right: Shop Name
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Navy
  doc.text(data.tenantName, 190, 25, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(data.tenantAddress || "Location Pending", 190, 31, { align: "right" });
  doc.text(`Phone: ${data.tenantPhone || "N/A"}`, 190, 36, { align: "right" });

  // 2. Title Section
  doc.setDrawColor(230);
  doc.line(20, 45, 190, 45);
  
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42);
  doc.text("TAX INVOICE", 20, 65);

  // 3. Invoice Metadata
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85); // Slate
  doc.text(`Invoice Number: #${data.bookingId}`, 20, 80);
  doc.text(`Date of Issue: ${new Date().toLocaleDateString("en-AU")}`, 20, 85);
  doc.text(`Service Date: ${data.date} at ${data.time}`, 20, 90);

  // Buyer Info
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 130, 80);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerName, 130, 85);

  // 4. Items Table
  const tableRows = data.services.map(s => [s.name, `$${s.price.toFixed(2)}`]);
  tableRows.push(["Priority Booking Fee", `$${priorityFee.toFixed(2)}`]);
  
  (doc as any).autoTable({
    startY: 105,
    head: [["DESCRIPTION", "AMOUNT (AUD)"]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 20, right: 20 }
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // 5. Totals Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL PAID (AUD):`, 120, finalY + 15);
  doc.text(`$${totalAmount.toFixed(2)}`, 190, finalY + 15, { align: "right" });

  // 6. AU Standard Footer
  doc.setDrawColor(240);
  doc.line(20, 260, 190, 260);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.tenantName} | ABN: ${abn}`, 105, 270, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("No GST has been charged. This document is a record of payment for services rendered.", 105, 275, { align: "center" });
  doc.text("TrimSpace Marketplace: Style, Delivered.", 105, 280, { align: "center" });

  return doc.output("blob");
}
