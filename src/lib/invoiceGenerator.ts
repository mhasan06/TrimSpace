import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.setFont("helvetica", "bold");
  doc.text("TrimSpace", 20, 25);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Services Marketplace", 20, 30);

  // Top Right: Shop Name
  doc.setFontSize(14);
  doc.setTextColor(212, 175, 55); // Luxury Gold
  doc.text(data.tenantName, 190, 25, { align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(data.tenantAddress || "Location Pending", 190, 31, { align: "right" });
  doc.text(data.tenantPhone || "", 190, 36, { align: "right" });

  // 2. Title Section
  doc.setDrawColor(200);
  doc.line(20, 45, 190, 45);
  
  doc.setFontSize(22);
  doc.setTextColor(0);
  doc.text("INVOICE", 20, 60);

  // 3. Invoice Metadata
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Booking ID: ${data.bookingId}`, 20, 75);
  doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 20, 80);
  doc.text(`Service Date: ${data.date} at ${data.time}`, 20, 85);

  // Buyer Info
  doc.setFont("helvetica", "bold");
  doc.text("Billed To:", 130, 75);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerName, 130, 80);

  // 4. Items Table
  const tableRows = data.services.map(s => [s.name, `$${s.price.toFixed(2)}`]);
  tableRows.push(["Priority Booking", `$${priorityFee.toFixed(2)}`]);
  
  autoTable(doc, {
    startY: 95,
    head: [["Service Description", "Amount (AUD)"]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [0,0,0], textColor: [255, 255, 255] },
    margin: { left: 20, right: 20 }
  });

  const finalY = (doc as any).lastAutoTable.cursor.y;

  // 5. Totals Section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Amount (AUD):`, 120, finalY + 15);
  doc.text(`$${totalAmount.toFixed(2)}`, 190, finalY + 15, { align: "right" });

  // 6. AU Standard Footer
  doc.setDrawColor(240);
  doc.line(20, 260, 190, 260);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.tenantName} | ABN: ${abn}`, 105, 270, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("This document is a valid Invoice under Australian standards. No GST has been charged.", 105, 275, { align: "center" });
  doc.text("TrimSpace Platform: Facilitating premium connections between masters and clients.", 105, 280, { align: "center" });

  return doc.output("blob");
}
